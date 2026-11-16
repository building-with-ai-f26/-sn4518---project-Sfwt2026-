/*
 * FlexWeek prototype — user profiles (onboarding step 1).
 *
 * - validateProfile: checks the onboarding form and returns a clean profile (always metric).
 * - bmi:             calculated from height and weight, never asked for.
 * - createStore:     saves profiles on this device only (localStorage). No login, no server.
 *                    Each profile has its own key, so saving one never overwrites another.
 *
 * Works in the browser (window.FlexWeekProfile) and in Node (require) for tests.
 * The coach rules in coach.js do not use the profile yet.
 */
(function (root) {
  'use strict';

  const SCHEMA_VERSION = 1;

  const GOALS = {
    lose_fat: 'Lose fat',
    get_stronger: 'Get stronger',
    stay_healthy: 'Stay healthy',
    build_mass: 'Build mass',
  };

  // Accepted ranges (metric). Wide on purpose: they catch typos, not judge people.
  const LIMITS = {
    age: [13, 100],
    heightCm: [100, 250],
    weightKg: [30, 300],
    bodyFatPct: [3, 60],
  };

  const CM_PER_INCH = 2.54;
  const KG_PER_LB = 0.45359237;

  const round1 = (x) => Math.round(x * 10) / 10;
  const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
  const toNumber = (v) => (isBlank(v) ? null : Number(v));

  // BMI = weight (kg) / height (m)^2, rounded to one decimal.
  function bmi(heightCm, weightKg) {
    const h = Number(heightCm) / 100;
    const w = Number(weightKg);
    if (!(h > 0) || !(w > 0)) return null;
    return round1(w / (h * h));
  }

  /*
   * input: { nickname?, units: 'metric'|'imperial', age, goal, bodyFatPct?,
   *          heightCm, weightKg            (metric)
   *          heightFt, heightIn, weightLb  (imperial) }
   * Form values may be strings. Returns { ok, errors: { field: message }, measured, profile }.
   */
  function validateProfile(input) {
    const src = input || {};
    const errors = {};
    const units = src.units === 'imperial' ? 'imperial' : 'metric';

    function checkRange(field, value, label, unit) {
      const [lo, hi] = LIMITS[field];
      if (value < lo || value > hi) errors[field] = `${label} must be between ${lo} and ${hi}${unit}.`;
    }

    // Age — required, whole number.
    const age = toNumber(src.age);
    if (age === null) errors.age = 'Age is required.';
    else if (!Number.isInteger(age)) errors.age = 'Age must be a whole number.';
    else checkRange('age', age, 'Age', '');

    // Height — required. Converted to cm.
    let heightCm = null;
    if (units === 'metric') {
      heightCm = toNumber(src.heightCm);
      if (heightCm === null) errors.height = 'Height is required.';
      else if (!Number.isFinite(heightCm)) errors.height = 'Height must be a number.';
    } else {
      const ft = toNumber(src.heightFt);
      const inch = isBlank(src.heightIn) ? 0 : Number(src.heightIn);
      if (ft === null) errors.height = 'Height is required.';
      else if (!Number.isFinite(ft) || !Number.isFinite(inch) || inch < 0 || inch >= 12) errors.height = 'Height must be feet plus 0–11 inches.';
      else heightCm = (ft * 12 + inch) * CM_PER_INCH;
    }
    if (!errors.height) {
      const [lo, hi] = LIMITS.heightCm;
      if (heightCm < lo || heightCm > hi) errors.height = units === 'metric'
        ? `Height must be between ${lo} and ${hi} cm.`
        : 'Height must be between 3 ft 4 in and 8 ft 2 in.';
    }

    // Weight — required. Converted to kg.
    let weightKg = null;
    const rawWeight = toNumber(units === 'metric' ? src.weightKg : src.weightLb);
    if (rawWeight === null) errors.weight = 'Weight is required.';
    else if (!Number.isFinite(rawWeight)) errors.weight = 'Weight must be a number.';
    else {
      weightKg = units === 'metric' ? rawWeight : rawWeight * KG_PER_LB;
      const [lo, hi] = LIMITS.weightKg;
      if (weightKg < lo || weightKg > hi) errors.weight = units === 'metric'
        ? `Weight must be between ${lo} and ${hi} kg.`
        : 'Weight must be between 66 and 661 lb.';
    }

    // Body fat % — optional.
    const bodyFatPct = toNumber(src.bodyFatPct);
    if (bodyFatPct !== null) {
      if (!Number.isFinite(bodyFatPct)) errors.bodyFatPct = 'Body fat must be a number.';
      else checkRange('bodyFatPct', bodyFatPct, 'Body fat', '%');
    }

    // Goal — required, exactly one of GOALS.
    if (isBlank(src.goal)) errors.goal = 'Pick a goal.';
    else if (!GOALS[src.goal]) errors.goal = 'Pick one of the listed goals.';

    const ok = Object.keys(errors).length === 0;
    return {
      ok,
      errors,
      // Height and weight in metric when each is valid on its own, so the form can show BMI live.
      measured: { heightCm: errors.height ? null : heightCm, weightKg: errors.weight ? null : weightKg },
      profile: ok
        ? {
            nickname: String(src.nickname || '').trim().slice(0, 40),
            units,
            age,
            heightCm,
            weightKg,
            bodyFatPct,
            goal: src.goal,
          }
        : null,
    };
  }

  /*
   * Profile storage on this device. `storage` is window.localStorage in the browser,
   * or any object with getItem/setItem/removeItem (tests use a fake).
   *   flexweek:profiles        → [{ id, nickname }]   (list for the "Who's training?" picker)
   *   flexweek:profile:<id>    → { schemaVersion, id, createdAt, updatedAt, profile }
   *   flexweek:current         → id of the last profile used
   */
  function createStore(storage) {
    const LIST_KEY = 'flexweek:profiles';
    const CURRENT_KEY = 'flexweek:current';
    const profileKey = (id) => `flexweek:profile:${id}`;

    function readJSON(key, fallback) {
      try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    }

    function listProfiles() {
      const list = readJSON(LIST_KEY, []);
      return Array.isArray(list) ? list : [];
    }

    function loadProfile(id) {
      const rec = readJSON(profileKey(id), null);
      return rec && rec.profile ? rec : null;
    }

    function newId() {
      return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    // Saves a validated profile. Pass an id to update that profile; omit it to create a new one.
    function saveProfile(profile, id) {
      const now = new Date().toISOString();
      const existing = id ? loadProfile(id) : null;
      const pid = existing ? id : newId();
      const list = listProfiles();
      const nickname = profile.nickname || existing?.profile.nickname || `Profile ${list.length + (existing ? 0 : 1)}`;
      const rec = {
        schemaVersion: SCHEMA_VERSION,
        id: pid,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
        profile: { ...profile, nickname },
      };
      storage.setItem(profileKey(pid), JSON.stringify(rec));
      const entry = { id: pid, nickname };
      const inList = list.some((p) => p.id === pid);
      storage.setItem(LIST_KEY, JSON.stringify(inList ? list.map((p) => (p.id === pid ? entry : p)) : list.concat(entry)));
      return rec;
    }

    function getCurrentId() {
      const id = storage.getItem(CURRENT_KEY);
      return id && loadProfile(id) ? id : null;
    }

    function setCurrentId(id) {
      if (id) storage.setItem(CURRENT_KEY, id);
      else storage.removeItem(CURRENT_KEY);
    }

    return { listProfiles, loadProfile, saveProfile, getCurrentId, setCurrentId };
  }

  const api = { SCHEMA_VERSION, GOALS, LIMITS, bmi, validateProfile, createStore };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexWeekProfile = api;
})(typeof window !== 'undefined' ? window : globalThis);

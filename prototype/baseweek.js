/*
 * FlexWeek prototype — base week (onboarding step 2).
 *
 * The user's usual training week: how many days, and which session type on which weekday.
 * The result has the exact shape coach.js takes as `basePlan`: [{ type, day }], day 0=Mon … 6=Sun.
 *
 * - SESSION_TYPES:    the types the user can pick (same keys as coach.js).
 * - defaultWeek(n):   a sensible starting week for n days (spread days, balanced split).
 * - validateBaseWeek: checks the form and returns a clean, day-sorted week.
 * - createWeekStore:  saves one base week per profile on this device (localStorage), under its own key,
 *                     so saving one tester's week never touches another's or their profile.
 *
 * Works in the browser (window.FlexWeekBaseWeek) and in Node (require) for tests.
 */
(function (root) {
  'use strict';

  const SCHEMA_VERSION = 1;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Keep in sync with SESSION_TYPES in coach.js.
  const SESSION_TYPES = {
    upper: 'Upper',
    lower: 'Lower',
    full: 'Full Body',
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
  };

  // Starting point for each number of days. The user can change any of it.
  const DEFAULT_DAYS = {
    1: [0],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  const DEFAULT_TYPES = {
    1: ['full'],
    2: ['full', 'full'],
    3: ['upper', 'lower', 'full'],
    4: ['upper', 'lower', 'upper', 'lower'],
    5: ['upper', 'lower', 'push', 'pull', 'legs'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    7: ['push', 'pull', 'legs', 'upper', 'lower', 'full', 'full'],
  };

  function defaultWeek(n) {
    const count = Math.max(1, Math.min(7, Math.floor(Number(n)) || 3));
    return DEFAULT_DAYS[count].map((day, i) => ({ type: DEFAULT_TYPES[count][i], day }));
  }

  /*
   * input: [{ type, day }] — day may be a string from a <select>.
   * Returns { ok, errors: [message], week } — week is sorted Mon→Sun, or null when invalid.
   */
  function validateBaseWeek(input) {
    const rows = Array.isArray(input) ? input : [];
    const errors = [];
    if (rows.length < 1 || rows.length > 7) errors.push('Pick between 1 and 7 training days.');

    const week = rows.map((r) => ({ type: r && r.type, day: r && r.day !== '' && r.day !== null ? Number(r.day) : NaN }));
    week.forEach((s, i) => {
      if (!SESSION_TYPES[s.type]) errors.push(`Day ${i + 1}: pick a session type.`);
      if (!Number.isInteger(s.day) || s.day < 0 || s.day > 6) errors.push(`Day ${i + 1}: pick a weekday.`);
    });
    const seen = new Set();
    week.forEach((s) => {
      if (Number.isInteger(s.day) && s.day >= 0 && s.day <= 6) {
        if (seen.has(s.day)) errors.push(`${DAYS[s.day]} is used twice. Pick a different day for each session.`);
        seen.add(s.day);
      }
    });

    const ok = errors.length === 0;
    return { ok, errors: [...new Set(errors)], week: ok ? week.slice().sort((a, b) => a.day - b.day) : null };
  }

  /*
   * Base weeks on this device. `storage` is window.localStorage or any getItem/setItem/removeItem object.
   *   flexweek:week:<profileId> → { schemaVersion, updatedAt, week: [{ type, day }] }
   */
  function createWeekStore(storage) {
    const key = (profileId) => `flexweek:week:${profileId}`;

    function loadWeek(profileId) {
      try {
        const rec = JSON.parse(storage.getItem(key(profileId)) || 'null');
        if (!rec) return null;
        const r = validateBaseWeek(rec.week);
        return r.ok ? r.week : null;
      } catch (e) {
        return null;
      }
    }

    // Saves a week for one profile. Returns the validation result; nothing is written when invalid.
    function saveWeek(profileId, week) {
      const r = validateBaseWeek(week);
      if (r.ok) {
        storage.setItem(key(profileId), JSON.stringify({ schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString(), week: r.week }));
      }
      return r;
    }

    return { loadWeek, saveWeek };
  }

  const api = { SCHEMA_VERSION, DAYS, SESSION_TYPES, defaultWeek, validateBaseWeek, createWeekStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexWeekBaseWeek = api;
})(typeof window !== 'undefined' ? window : globalThis);

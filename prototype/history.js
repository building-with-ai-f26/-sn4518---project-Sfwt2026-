/*
 * Workout history: what each person actually did, saved on this device only (localStorage).
 * - dateOf:      the calendar date of a weekday in a week (Monday '2026-11-16' + 4 → Friday '2026-11-20').
 * - readResult:  turns one exercise's three boxes (Sets, Reps, Weight in lb) into a result to save,
 *                into nothing (skipped: Reps and Weight both 0 or blank), or into an error message.
 * - createHistoryStore: one history per person, under its own key, plus the numbers typed but not saved yet.
 *     flexweek:history:<profileId>      → { version: 1, days: { '<date>': { week, day, savedAt, exercises: [{ id, name, sets, reps, weight }] } } }
 *     flexweek:draft:<profileId>:<date> → { '<exerciseId>': { sets, reps, weight } }  (the boxes' text, as typed)
 * A saved day is final: saveDay never overwrites a date that is already saved.
 * History is kept by exercise, so swapping an exercise or editing the base workout never erases it.
 */
(function (root) {
  'use strict';

  const VERSION = 1;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const LIMITS = {
    sets: { min: 1, max: 20, whole: true, label: 'Sets' },
    reps: { min: 0, max: 100, whole: true, label: 'Reps' },
    weight: { min: 0, max: 2000, whole: false, label: 'Weight (lb)' },
  };

  function dateOf(week, day) {
    const [y, m, d] = week.split('-').map(Number);
    const date = new Date(y, m - 1, d + day);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Reads one box. Blank gives `blank`; anything else must be a number inside the field's limits.
  function readBox(typed, field, blank) {
    const raw = typed && typed[field] != null ? String(typed[field]).trim() : '';
    if (raw === '') return { ok: true, value: blank };
    const n = Number(raw);
    const rule = LIMITS[field];
    if (!Number.isFinite(n) || n < rule.min || n > rule.max || (rule.whole && !Number.isInteger(n))) {
      return { ok: false, error: `${rule.label} must be ${rule.whole ? 'a whole number' : 'a number'} from ${rule.min} to ${rule.max}.` };
    }
    return { ok: true, value: n };
  }

  // typed: { sets, reps, weight } as typed ('' when blank). A blank Sets box means the planned number of sets.
  // Returns { ok: true, result: { sets, reps, weight } }, { ok: true, result: null } when skipped, or { ok: false, error }.
  function readResult(typed, plannedSets) {
    const reps = readBox(typed, 'reps', 0);
    if (!reps.ok) return reps;
    const weight = readBox(typed, 'weight', 0);
    if (!weight.ok) return weight;
    if (reps.value === 0 && weight.value === 0) return { ok: true, result: null };
    const sets = readBox(typed, 'sets', plannedSets);
    if (!sets.ok) return sets;
    return { ok: true, result: { sets: sets.value, reps: reps.value, weight: weight.value } };
  }

  const validEntry = (e) => e && typeof e.id === 'string' && typeof e.name === 'string' &&
    [e.sets, e.reps, e.weight].every(Number.isFinite);

  function createHistoryStore(storage) {
    const key = (profileId) => `flexweek:history:${profileId}`;
    const draftKey = (profileId, date) => `flexweek:draft:${profileId}:${date}`;

    // A missing or unreadable history reads as empty, so the app keeps working.
    function read(profileId) {
      try {
        const h = JSON.parse(storage.getItem(key(profileId)) || 'null');
        if (h && h.version === VERSION && h.days && typeof h.days === 'object' && !Array.isArray(h.days)) return h;
      } catch (_) { /* unreadable: treat as empty */ }
      return { version: VERSION, days: {} };
    }

    // The saved day for a date, or null when that date was not logged.
    function loadDay(profileId, date) {
      const d = read(profileId).days[date];
      return d && Array.isArray(d.exercises) ? { ...d, exercises: d.exercises.filter(validEntry) } : null;
    }

    // Newest workout dates first; never infer an old workout's type from today's plan.
    function listDays(profileId) {
      return Object.keys(read(profileId).days).filter((date) => DATE.test(date))
        .sort().reverse().flatMap((date) => {
          const day = loadDay(profileId, date);
          return day ? [{ date, ...day }] : [];
        });
    }

    // Saves one finished day: { week, day, exercises: [{ id, name, sets, reps, weight }] }.
    // Returns false and writes nothing when the date is already saved (final), the date is malformed,
    // or no exercise is valid.
    function saveDay(profileId, date, day) {
      const h = read(profileId);
      const exercises = (day.exercises || []).filter(validEntry)
        .map(({ id, name, sets, reps, weight }) => ({ id, name, sets, reps, weight }));
      if (!DATE.test(date) || h.days[date] || !exercises.length) return false;
      h.days[date] = { week: day.week, day: day.day, savedAt: new Date().toISOString(), exercises };
      if (Array.isArray(day.workoutTypes)) {
        h.days[date].workoutTypes = day.workoutTypes.filter((type) => typeof type === 'string');
      }
      storage.setItem(key(profileId), JSON.stringify(h));
      return true;
    }

    // The latest saved result for one exercise (by workout date), or null when it was never logged.
    function lastResult(profileId, exerciseId) {
      const days = read(profileId).days;
      const dates = Object.keys(days).filter((d) => DATE.test(d)).sort().reverse();
      for (const date of dates) {
        const found = Array.isArray(days[date].exercises) &&
          days[date].exercises.find((e) => e.id === exerciseId && validEntry(e));
        if (found) return { date, sets: found.sets, reps: found.reps, weight: found.weight };
      }
      return null;
    }

    // Numbers typed for a date but not saved yet, so a reload doesn't lose them.
    function loadDraft(profileId, date) {
      try {
        const d = JSON.parse(storage.getItem(draftKey(profileId, date)) || 'null');
        return d && typeof d === 'object' && !Array.isArray(d) ? d : {};
      } catch (_) { return {}; }
    }
    function saveDraft(profileId, date, draft) {
      storage.setItem(draftKey(profileId, date), JSON.stringify(draft));
    }
    function clearDraft(profileId, date) {
      storage.removeItem(draftKey(profileId, date));
    }

    return { loadDay, listDays, saveDay, lastResult, loadDraft, saveDraft, clearDraft };
  }

  const api = { LIMITS, dateOf, readResult, createHistoryStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexWeekHistory = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Dated workout snapshots. Local calendar dates, Monday-first; no completion claims. */
(function (root) {
  'use strict';
  function calendar(now = new Date()) {
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    const date = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    return { day, week: date };
  }
  function canEdit(week, selected, day, now = new Date()) {
    const today = calendar(now);
    return week === today.week && Number.isInteger(day) && day >= 0 && day <= 6 && day === selected;
  }
  function createWorkoutStore(storage) {
    const key = (id, week) => `flexweek:workouts:${id}:${week}`;
    function load(id, week) {
      try {
        const r = JSON.parse(storage.getItem(key(id, week)) || 'null');
        return r && r.version === 1 && r.week === week && r.equipment === 'full' &&
          r.result && Array.isArray(r.result.week) && r.result.week.length === 7 &&
          r.result.week.every((d) => Array.isArray(d.activities) && Array.isArray(d.sessions) &&
            d.sessions.every((s) => Array.isArray(s.exercises) && s.exercises.every((e) =>
              typeof e.id === 'string' && typeof e.name === 'string' && Number.isFinite(e.sets)))) &&
          Array.isArray(r.result.changes) && Array.isArray(r.result.notes) ? r : null;
      } catch (_) { return null; }
    }
    function save(id, record) {
      storage.setItem(key(id, record.week), JSON.stringify(record));
    }
    return { load, save };
  }
  const api = { calendar, canEdit, createWorkoutStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexWeekWorkoutWeek = api;
})(typeof window !== 'undefined' ? window : globalThis);

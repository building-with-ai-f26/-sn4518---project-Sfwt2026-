const test = require('node:test');
const assert = require('node:assert/strict');
const { dateOf, readResult, createHistoryStore } = require('../docs/app/history.js');

const memory = () => {
  const data = new Map();
  return { data, getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
};
const bench = { id: 'Barbell_Bench_Press', name: 'Barbell Bench Press' };
const dbBench = { id: 'Dumbbell_Bench_Press', name: 'Dumbbell Bench Press' };

test('history list orders dates, isolates profiles and preserves workout types without guessing legacy types', () => {
  const storage = memory();
  const store = createHistoryStore(storage);
  const day = { week: '2026-11-16', day: 0, exercises: [{ ...bench, sets: 3, reps: 8, weight: 135 }] };
  store.saveDay('a', '2026-11-16', day);
  store.saveDay('a', '2026-11-20', { ...day, day: 4, workoutTypes: ['upper'] });
  store.saveDay('b', '2026-11-21', day);
  const list = store.listDays('a');
  assert.deepEqual(list.map((d) => d.date), ['2026-11-20', '2026-11-16']);
  assert.deepEqual(list[0].workoutTypes, ['upper']);
  assert.equal(list[1].workoutTypes, undefined);
  assert.deepEqual(store.listDays('unknown'), []);
  storage.setItem('flexweek:history:broken', '{');
  assert.deepEqual(store.listDays('broken'), []);
});

test('dateOf gives the date of the picked weekday, across month and year ends', () => {
  assert.equal(dateOf('2026-11-16', 0), '2026-11-16');
  assert.equal(dateOf('2026-11-16', 4), '2026-11-20');
  assert.equal(dateOf('2026-11-30', 2), '2026-12-02');
  assert.equal(dateOf('2026-12-28', 6), '2027-01-03');
});

test('reps and weight both 0 or blank skip the exercise; either above 0 is saved', () => {
  assert.deepEqual(readResult({ sets: '', reps: '', weight: '' }, 3), { ok: true, result: null });
  assert.deepEqual(readResult({ sets: '4', reps: '0', weight: '0' }, 3), { ok: true, result: null });
  assert.deepEqual(readResult({ reps: '8', weight: '135' }, 3), { ok: true, result: { sets: 3, reps: 8, weight: 135 } }, 'blank Sets means the planned sets');
  assert.deepEqual(readResult({ sets: '4', reps: '12', weight: '' }, 3), { ok: true, result: { sets: 4, reps: 12, weight: 0 } }, 'bodyweight: reps only');
  assert.deepEqual(readResult({ sets: '2', reps: '', weight: '47.5' }, 3), { ok: true, result: { sets: 2, reps: 0, weight: 47.5 } });
});

test('impossible numbers are rejected with a message', () => {
  for (const typed of [{ reps: '8.5' }, { reps: '-1' }, { reps: '101' }, { weight: '2001' }, { weight: 'abc' },
    { sets: '0', reps: '8' }, { sets: '2.5', reps: '8' }, { sets: '21', reps: '8' }]) {
    const r = readResult(typed, 3);
    assert.equal(r.ok, false, JSON.stringify(typed));
    assert.match(r.error, /must be/);
  }
});

test('each person has their own history, and a saved day is final', () => {
  const storage = memory();
  const store = createHistoryStore(storage);
  const day = { week: '2026-11-16', day: 4, exercises: [{ ...bench, sets: 3, reps: 8, weight: 135 }] };
  assert.equal(store.saveDay('a', '2026-11-20', day), true);
  assert.equal(store.loadDay('a', '2026-11-20').exercises[0].weight, 135);
  assert.equal(store.loadDay('b', '2026-11-20'), null, 'another person sees nothing');
  assert.equal(store.lastResult('b', bench.id), null);
  const again = { ...day, exercises: [{ ...bench, sets: 3, reps: 8, weight: 999 }] };
  assert.equal(store.saveDay('a', '2026-11-20', again), false, 'the same date cannot be saved twice');
  assert.equal(store.loadDay('a', '2026-11-20').exercises[0].weight, 135);
  assert.equal(store.saveDay('a', '2026-11-21', { ...day, exercises: [] }), false, 'an empty day is not saved');
  assert.equal(store.saveDay('a', 'Friday', day), false);
});

test('lastResult finds the latest logged date for that exercise, whatever the order of saving', () => {
  const store = createHistoryStore(memory());
  store.saveDay('a', '2026-11-20', { week: '2026-11-16', day: 4, exercises: [{ ...bench, sets: 3, reps: 8, weight: 145 }] });
  store.saveDay('a', '2026-11-16', { week: '2026-11-16', day: 0, exercises: [{ ...bench, sets: 3, reps: 8, weight: 135 }, { ...dbBench, sets: 3, reps: 10, weight: 50 }] });
  assert.deepEqual(store.lastResult('a', bench.id), { date: '2026-11-20', sets: 3, reps: 8, weight: 145 });
  assert.deepEqual(store.lastResult('a', dbBench.id), { date: '2026-11-16', sets: 3, reps: 10, weight: 50 });
  assert.equal(store.lastResult('a', 'Pull-Up'), null);
});

test('unreadable history reads as empty instead of breaking the app', () => {
  const storage = memory();
  const store = createHistoryStore(storage);
  for (const bad of ['{', '[]', '{"version":2,"days":{}}', '{"version":1,"days":[]}']) {
    storage.setItem('flexweek:history:a', bad);
    assert.equal(store.loadDay('a', '2026-11-20'), null);
    assert.equal(store.lastResult('a', bench.id), null);
  }
  storage.setItem('flexweek:history:a', JSON.stringify({ version: 1, days: {
    '2026-11-20': { exercises: [{ ...bench, sets: 3, reps: 'eight', weight: 135 }] },
    '2026-11-19': { exercises: 'nope' },
    '2026-11-18': { exercises: [{ ...bench, sets: 3, reps: 6, weight: 155 }] },
  } }));
  assert.deepEqual(store.lastResult('a', bench.id), { date: '2026-11-18', sets: 3, reps: 6, weight: 155 }, 'bad entries are skipped');
  assert.deepEqual(store.loadDay('a', '2026-11-20').exercises, []);
});

test('typed numbers are kept as a draft per person and date until cleared', () => {
  const storage = memory();
  const store = createHistoryStore(storage);
  assert.deepEqual(store.loadDraft('a', '2026-11-20'), {});
  store.saveDraft('a', '2026-11-20', { [bench.id]: { sets: '', reps: '8', weight: '135' } });
  assert.deepEqual(store.loadDraft('a', '2026-11-20'), { [bench.id]: { sets: '', reps: '8', weight: '135' } });
  assert.deepEqual(store.loadDraft('b', '2026-11-20'), {});
  assert.deepEqual(store.loadDraft('a', '2026-11-19'), {});
  store.clearDraft('a', '2026-11-20');
  assert.deepEqual(store.loadDraft('a', '2026-11-20'), {});
  storage.setItem('flexweek:draft:a:2026-11-20', '{');
  assert.deepEqual(store.loadDraft('a', '2026-11-20'), {});
});

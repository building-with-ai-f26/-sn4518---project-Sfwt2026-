// Deterministic tests for onboarding step 2: the base week (validation, defaults, per-profile storage)
// and that a saved base week feeds straight into the coach.
// Run from the repo root:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultWeek, validateBaseWeek, createWeekStore, SESSION_TYPES } = require('../prototype/baseweek.js');
const coach = require('../prototype/coach.js');

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), keys: () => [...m.keys()] };
}

// ---- Session types ----

test('base week offers exactly the coach session types', () => {
  assert.deepEqual(Object.keys(SESSION_TYPES).sort(), Object.keys(coach.SESSION_TYPES).sort());
  assert.deepEqual(Object.keys(SESSION_TYPES).sort(), ['full', 'legs', 'lower', 'pull', 'push', 'upper']);
});

// ---- Defaults ----

test('defaultWeek(n) gives n valid sessions on distinct days, for every n from 1 to 7', () => {
  for (let n = 1; n <= 7; n++) {
    const w = defaultWeek(n);
    assert.equal(w.length, n);
    assert.equal(validateBaseWeek(w).ok, true, `default for ${n} days is valid`);
  }
});

test('defaultWeek(3) is Upper Mon, Lower Wed, Full Body Fri', () => {
  assert.deepEqual(defaultWeek(3), [{ type: 'upper', day: 0 }, { type: 'lower', day: 2 }, { type: 'full', day: 4 }]);
});

// ---- Validation ----

test('a valid week is accepted, form strings become numbers, and it comes back sorted Mon→Sun', () => {
  const r = validateBaseWeek([{ type: 'legs', day: '4' }, { type: 'push', day: '0' }, { type: 'pull', day: '2' }]);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.week, [{ type: 'push', day: 0 }, { type: 'pull', day: 2 }, { type: 'legs', day: 4 }]);
});

test('no days, or more than 7, is rejected', () => {
  assert.equal(validateBaseWeek([]).ok, false);
  assert.equal(validateBaseWeek(null).ok, false);
  const eight = Array.from({ length: 8 }, (_, i) => ({ type: 'full', day: i % 7 }));
  assert.equal(validateBaseWeek(eight).ok, false);
});

test('an unknown session type is rejected', () => {
  const r = validateBaseWeek([{ type: 'cardio', day: 0 }]);
  assert.equal(r.ok, false);
  assert.equal(r.week, null);
  assert.match(r.errors.join(' '), /session type/);
});

test('a missing or out-of-range weekday is rejected', () => {
  for (const day of [undefined, null, '', 7, -1, 2.5, 'Mon']) {
    assert.equal(validateBaseWeek([{ type: 'upper', day }]).ok, false, `day ${String(day)} should fail`);
  }
});

test('two sessions on the same weekday are rejected, naming the day', () => {
  const r = validateBaseWeek([{ type: 'upper', day: 1 }, { type: 'lower', day: 1 }]);
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /Tue is used twice/);
});

// ---- Storage: one base week per profile ----

test('save then load returns the same week', () => {
  const store = createWeekStore(fakeStorage());
  const week = [{ type: 'upper', day: 0 }, { type: 'lower', day: 3 }];
  assert.equal(store.saveWeek('pA', week).ok, true);
  assert.deepEqual(store.loadWeek('pA'), week);
});

test('a profile with no saved week loads as null', () => {
  assert.equal(createWeekStore(fakeStorage()).loadWeek('nobody'), null);
});

test("saving one tester's week never changes another tester's week", () => {
  const storage = fakeStorage();
  const store = createWeekStore(storage);
  store.saveWeek('pA', [{ type: 'full', day: 0 }]);
  store.saveWeek('pB', [{ type: 'push', day: 1 }, { type: 'pull', day: 3 }]);
  store.saveWeek('pA', [{ type: 'legs', day: 5 }]); // A edits theirs
  assert.deepEqual(store.loadWeek('pA'), [{ type: 'legs', day: 5 }]);
  assert.deepEqual(store.loadWeek('pB'), [{ type: 'push', day: 1 }, { type: 'pull', day: 3 }]);
});

test('base weeks use their own keys and leave profile records alone', () => {
  const storage = fakeStorage();
  storage.setItem('flexweek:profile:pA', '{"keep":"me"}');
  createWeekStore(storage).saveWeek('pA', [{ type: 'upper', day: 0 }]);
  assert.equal(storage.getItem('flexweek:profile:pA'), '{"keep":"me"}');
  assert.ok(storage.keys().includes('flexweek:week:pA'));
});

test('an invalid week is not saved', () => {
  const storage = fakeStorage();
  const store = createWeekStore(storage);
  store.saveWeek('pA', [{ type: 'upper', day: 0 }]);
  const r = store.saveWeek('pA', [{ type: 'upper', day: 0 }, { type: 'lower', day: 0 }]);
  assert.equal(r.ok, false);
  assert.deepEqual(store.loadWeek('pA'), [{ type: 'upper', day: 0 }], 'previous week kept');
});

test('corrupt saved data loads as null instead of crashing', () => {
  const storage = fakeStorage();
  storage.setItem('flexweek:week:pA', '{not json');
  storage.setItem('flexweek:week:pB', JSON.stringify({ week: [{ type: 'nope', day: 0 }] }));
  const store = createWeekStore(storage);
  assert.equal(store.loadWeek('pA'), null);
  assert.equal(store.loadWeek('pB'), null);
});

// ---- Feeding the coach ----

test('a saved base week goes straight into the coach as basePlan', () => {
  const store = createWeekStore(fakeStorage());
  store.saveWeek('pA', [{ type: 'push', day: 0 }, { type: 'pull', day: 2 }, { type: 'legs', day: 4 }]);
  const basePlan = store.loadWeek('pA');

  const same = coach.adjustWeek({ basePlan, daysAvailable: basePlan.length, activities: [], equipment: 'full' });
  assert.equal(same.changes.length, 0);
  assert.deepEqual(same.week.map((d) => d.sessions.map((s) => s.label)).filter((x) => x.length).flat(), ['Push', 'Pull', 'Legs']);

  const short = coach.adjustWeek({ basePlan, daysAvailable: 2, activities: [], equipment: 'full' });
  const labels = short.week.flatMap((d) => d.sessions.map((s) => s.label)).sort();
  assert.deepEqual(labels, ['Legs', 'Upper (Push + Pull)']);
});

test('every default week runs through the coach without errors', () => {
  for (let n = 1; n <= 7; n++) {
    const r = coach.adjustWeek({ basePlan: defaultWeek(n), daysAvailable: n, activities: [{ type: 'soccer', day: 3 }], equipment: 'home' });
    assert.equal(r.error, undefined);
    assert.equal(r.week.flatMap((d) => d.sessions).length, n);
  }
});

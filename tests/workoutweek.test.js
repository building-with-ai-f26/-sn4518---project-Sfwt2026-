const test = require('node:test');
const assert = require('node:assert/strict');
const { calendar, canEdit, createWorkoutStore } = require('../prototype/workoutweek.js');

test('local weeks start Monday across Sunday, year and daylight-saving boundaries', () => {
  assert.deepEqual(calendar(new Date(2027, 0, 3, 23)), { day: 6, week: '2026-12-28' });
  assert.deepEqual(calendar(new Date(2027, 0, 4, 0)), { day: 0, week: '2027-01-04' });
  assert.deepEqual(calendar(new Date(2026, 10, 1, 12)), { day: 6, week: '2026-10-26' });
});

test('any selected weekday can change even when the real date is Friday', () => {
  const now = new Date(2026, 10, 13, 12);
  for (let day = 0; day < 7; day++) {
    assert.equal(canEdit('2026-11-09', day, day, now), true);
  }
  assert.equal(canEdit('2026-11-09', 2, 2, now), true);
  assert.equal(canEdit('2026-11-09', 4, 4, now), true);
  assert.equal(canEdit('2026-11-09', 4, 2, now), false);
  assert.equal(canEdit('2026-11-02', 2, 2, now), false);
  assert.equal(canEdit('2026-11-09', 7, 7, now), false);
  assert.equal(canEdit('2026-11-09', -1, -1, now), false);
});

test('missing, corrupt and malformed workout snapshots are rejected', () => {
  let value = null;
  const store = createWorkoutStore({ getItem: () => value });
  for (const candidate of [null, '{', '{}', '{"version":1,"week":"2026-11-09","equipment":"full","result":{"week":[]}}']) {
    value = candidate;
    assert.equal(store.load('a', '2026-11-09'), null);
  }
});

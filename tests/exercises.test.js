// Deterministic tests for the exercise catalog (prototype/exercises.js) and its alternatives rule.
// Run from the repo root:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { EXERCISES, BY_ID, EQUIPMENT_ITEMS, canDo, alternatives } = require('../prototype/exercises.js');

const idOf = (name) => {
  const e = EXERCISES.find((x) => x.name === name);
  assert.ok(e, 'catalog should contain ' + name);
  return e.id;
};
const altNames = (name, available) => alternatives(idOf(name), available).map((e) => e.name);

test('catalog has the agreed size and mix', () => {
  const count = (cat) => EXERCISES.filter((e) => e.category === cat).length;
  assert.ok(EXERCISES.length >= 100 && EXERCISES.length <= 120);
  assert.equal(count('stretch'), 15);
  assert.equal(count('cardio'), 8);
  assert.equal(count('strength'), EXERCISES.length - 23);
});

test('every exercise has every field, with allowed values', () => {
  EXERCISES.forEach((e) => {
    assert.ok(e.id && e.name && e.sourceName, 'id and names: ' + e.id);
    assert.ok(e.primaryMuscles.length >= 1, 'primary muscle: ' + e.name);
    assert.ok(Array.isArray(e.secondaryMuscles), 'secondary muscles: ' + e.name);
    assert.ok(Array.isArray(e.equipment), 'equipment list: ' + e.name);
    assert.ok(e.instructions.length >= 1 && e.instructions.every((s) => s.trim()), 'instructions: ' + e.name);
    assert.ok(['push', 'pull', 'static', null].includes(e.force), 'force: ' + e.name);
    assert.ok(['compound', 'isolation', null].includes(e.mechanic), 'mechanic: ' + e.name);
    assert.equal(e.gif, '', 'gif placeholder: ' + e.name);
  });
});

test('strength exercises always say push/pull/static and compound/isolation', () => {
  EXERCISES.filter((e) => e.category === 'strength').forEach((e) => {
    assert.ok(e.force, 'force: ' + e.name);
    assert.ok(e.mechanic, 'mechanic: ' + e.name);
  });
});

test('ids and display names are unique', () => {
  assert.equal(new Set(EXERCISES.map((e) => e.id)).size, EXERCISES.length);
  assert.equal(new Set(EXERCISES.map((e) => e.name)).size, EXERCISES.length);
  assert.equal(Object.keys(BY_ID).length, EXERCISES.length);
});

test('equipment names the actual machine, never a vague word', () => {
  ['machine', 'other', 'body only', 'cable', 'bench', 'flat bench', 'incline bench'].forEach((vague) => {
    assert.ok(!EQUIPMENT_ITEMS.includes(vague), 'vague equipment tag: ' + vague);
  });
});

test('flat and incline dumbbell presses use exactly the same equipment', () => {
  assert.deepEqual(BY_ID[idOf('Dumbbell Bench Press')].equipment, ['adjustable bench', 'dumbbells']);
  assert.deepEqual(BY_ID[idOf('Incline Dumbbell Press')].equipment, ['adjustable bench', 'dumbbells']);
});

test('alternatives: same primary muscle, same push/pull, same compound/isolation', () => {
  EXERCISES.forEach((e) => {
    alternatives(e.id).forEach((a) => {
      assert.notEqual(a.id, e.id);
      assert.equal(a.primaryMuscles[0], e.primaryMuscles[0]);
      assert.equal(a.force, e.force);
      assert.equal(a.mechanic, e.mechanic);
    });
  });
});

test('alternatives for the barbell bench press', () => {
  const alts = altNames('Barbell Bench Press');
  ['Dumbbell Bench Press', 'Machine Chest Press', 'Push-Up', 'Chest Dip', 'Incline Barbell Bench Press']
    .forEach((n) => assert.ok(alts.includes(n), n));
  assert.ok(!alts.includes('Dumbbell Fly'), 'an isolation lift is not an alternative to a compound one');
  assert.ok(!alts.includes('Overhead Press'), 'a different muscle is not an alternative');
});

test('same equipment still counts: dumbbell flat and incline presses are alternatives', () => {
  assert.ok(altNames('Dumbbell Bench Press').includes('Incline Dumbbell Press'));
  assert.ok(altNames('Incline Dumbbell Press').includes('Dumbbell Bench Press'));
  assert.ok(altNames('Pull-Up').includes('Chin-Up'));
});

test('alternatives that use different equipment are listed first', () => {
  const press = BY_ID[idOf('Dumbbell Bench Press')];
  const same = alternatives(press.id).map((a) => a.equipment.join('|') === press.equipment.join('|'));
  assert.ok(same.includes(true) && same.includes(false));
  assert.equal(same.lastIndexOf(false) < same.indexOf(true), true);
  assert.equal(altNames('Dumbbell Bench Press').at(-1), 'Incline Dumbbell Press');
});

test('alternatives can be limited to the equipment the user has', () => {
  const home = ['dumbbells', 'adjustable bench', 'resistance band'];
  assert.deepEqual(altNames('Barbell Bench Press', home).sort(), ['Dumbbell Bench Press', 'Incline Dumbbell Press', 'Push-Up']);
  assert.deepEqual(altNames('Barbell Bench Press', []), ['Push-Up']); // bodyweight only
});

test('canDo: needs every item; bodyweight needs nothing', () => {
  const press = BY_ID[idOf('Dumbbell Bench Press')];
  assert.equal(canDo(press, ['dumbbells']), false);
  assert.equal(canDo(press, ['dumbbells', 'adjustable bench']), true);
  assert.equal(canDo(BY_ID[idOf('Push-Up')], []), true);
});

test('unknown id has no alternatives', () => {
  assert.deepEqual(alternatives('nope'), []);
});

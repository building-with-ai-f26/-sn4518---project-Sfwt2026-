const test = require('node:test');
const assert = require('node:assert/strict');
const { adjustWeek, exerciseAlternatives, swapExercise } = require('../prototype/coach.js');
const { EXERCISES, canDo } = require('../prototype/exercises.js');

const byName = (name) => EXERCISES.find((e) => e.name === name);
const home = ['dumbbells', 'adjustable bench', 'resistance band'];

test('manual alternatives keep catalog order, including same-equipment choices', () => {
  const source = byName('Dumbbell Bench Press');
  const expected = EXERCISES.filter((e) => e.id !== source.id &&
    e.primaryMuscles[0] === source.primaryMuscles[0] &&
    e.force === source.force && e.mechanic === source.mechanic && canDo(e, home));
  const choices = exerciseAlternatives(source.id, 'home');
  assert.deepEqual(choices, expected);
  assert.ok(choices.some((e) => e.name === 'Incline Dumbbell Press'));
  assert.ok(!choices.some((e) => e.name === 'Barbell Bench Press'));
});

test('every setup filters manual choices to exercises the coach can use', () => {
  for (const equipment of ['full', 'home', 'limited']) {
    const result = adjustWeek({ basePlan: [{ type: 'upper', day: 0 }], daysAvailable: 1, equipment });
    const exercise = result.week[0].sessions[0].exercises[0];
    const choices = exerciseAlternatives(exercise.id, equipment);
    assert.ok(choices.length);
    if (equipment === 'home') assert.ok(choices.every((e) => canDo(e, home)));
    if (equipment === 'limited') assert.ok(choices.every((e) =>
      !e.equipment.some((item) => ['barbell', 'rack', 'trap bar', 'ez curl bar', 'kettlebell'].includes(item))));
  }
});

test('a swap preserves reduced sets and group and leaves the generated week unchanged', () => {
  const input = { basePlan: [{ type: 'upper', day: 0 }], daysAvailable: 1,
    activities: [{ type: 'swimming', day: 3 }], equipment: 'home' };
  const result = adjustWeek(input);
  const before = structuredClone(result);
  const exercise = result.week[0].sessions[0].exercises[0];
  const swapped = swapExercise(exercise, byName('Incline Dumbbell Press').id, 'home');
  assert.equal(swapped.name, 'Incline Dumbbell Press');
  assert.equal(swapped.sets, 2);
  assert.equal(swapped.group, exercise.group);
  assert.match(swapped.swapReason, /your choice/);
  assert.deepEqual(result, before);
  assert.deepEqual(adjustWeek(input), before, 'regeneration starts from the base plan');
});

test('invalid, unavailable and unrelated replacements are rejected', () => {
  const exercise = { ...byName('Dumbbell Bench Press'), sets: 3, group: 'upper' };
  for (const id of ['unknown', exercise.id, byName('Barbell Bench Press').id, byName('Overhead Press').id]) {
    assert.equal(swapExercise(exercise, id, 'home'), null);
  }
  assert.deepEqual(exerciseAlternatives('unknown', 'home'), []);
  assert.deepEqual(exerciseAlternatives(exercise.id, 'unknown'), []);
});

test('an exercise without eligible alternatives returns an empty list', () => {
  const exercise = EXERCISES.find((e) => exerciseAlternatives(e.id, 'home').length === 0);
  assert.ok(exercise);
  assert.deepEqual(exerciseAlternatives(exercise.id, 'home'), []);
});

test('planner wires selection to one exercise and regeneration clears the swap', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const html = fs.readFileSync(require.resolve('../prototype/index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; } });
      return elements.get(id);
    },
    addEventListener() {},
  };
  const context = vm.createContext({ document, window: { FlexWeek: require('../prototype/coach.js') } });
  vm.runInContext(script, context);
  vm.runInContext("state.equipment = 'home'; run();", context);
  const before = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.match(elements.get('week').innerHTML, /aria-label="Swap Dumbbell Bench Press"/);
  // Editing the input alone must not change the equipment of the displayed result.
  vm.runInContext("state.equipment = 'full';", context);
  elements.get('week').listeners.change({ target: {
    dataset: { swapDay: '0', swapSession: '0', swapExercise: '0' },
    value: byName('Incline Dumbbell Press').id,
  } });
  const after = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.equal(after.week[0].sessions[0].exercises[0].name, 'Incline Dumbbell Press');
  assert.match(elements.get('week').innerHTML, /your choice/);
  assert.ok(!elements.get('week').innerHTML.includes(`<option value="${byName('Barbell Bench Press').id}">`));
  after.week[0].sessions[0].exercises[0] = before.week[0].sessions[0].exercises[0];
  assert.deepEqual(after.week, before.week, 'all other exercises and sessions are unchanged');
  vm.runInContext("state.equipment = 'home'; run();", context);
  assert.equal(vm.runInContext('JSON.stringify(currentResult)', context), JSON.stringify(before));
});

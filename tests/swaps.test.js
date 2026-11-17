const test = require('node:test');
const assert = require('node:assert/strict');
const { adjustWeek, exerciseAlternatives, swapExercise, addableExercises, addExercise } = require('../prototype/coach.js');
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

test('planner edits selected weekdays on Friday and retains independent swaps across reloads', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const html = fs.readFileSync(require.resolve('../prototype/index.html'), 'utf8');
  // Skip the PostHog analytics snippet; run the planner's own inline script.
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((s) => !s.includes('posthog'));
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; } });
      return elements.get(id);
    },
    addEventListener() {},
  };
  const WW = require('../prototype/workoutweek.js');
  const clock = new Date(2026, 10, 13, 12); // Friday
  const FixedDate = class extends Date { constructor(...args) { super(...(args.length ? args : [clock.getTime()])); } };
  const data = new Map();
  const storage = { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, v) };
  const context = vm.createContext({ document, Date: FixedDate, storage, window: {
    addEventListener() {},
    FlexWeek: require('../prototype/coach.js'),
    FlexWeekWorkoutWeek: { ...WW, calendar: () => WW.calendar(clock),
      canEdit: (week, selected, day) => WW.canEdit(week, selected, day, clock) },
    FlexWeekCatalog: require('../prototype/exercises.js'),
    FlexWeekWger: require('../prototype/wger.js'), // the page sets up its wger client on load; these tests never call it
    FlexWeekHistory: require('../prototype/history.js'),
  } });
  vm.runInContext(script, context);
  vm.runInContext("setBasePlan([{ type: 'upper', day: 0 }, { type: 'upper', day: 2 }, { type: 'upper', day: 4 }], 'a', storage);", context);
  let before = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.ok(!elements.get('week').innerHTML.includes('data-swap-day="0"'));
  assert.ok(elements.get('week').innerHTML.includes('data-swap-day="4"'));
  const source = before.week[2].sessions[0].exercises[0];
  const choice = exerciseAlternatives(source.id, 'full')[0];
  const swap = (day) => elements.get('week').listeners.change({ target: {
    dataset: { swapDay: String(day), swapSession: '0', swapExercise: '0' }, value: choice.id,
  } });
  swap(0);
  assert.equal(vm.runInContext('JSON.stringify(currentResult)', context), JSON.stringify(before));
  elements.get('workout-day').listeners.change({ target: { value: '0' } });
  assert.ok(elements.get('week').innerHTML.includes('data-swap-day="0"'));
  assert.ok(!elements.get('week').innerHTML.includes('data-swap-day="4"'));
  swap(0);
  const monday = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.equal(monday.week[0].sessions[0].exercises[0].id, choice.id);
  const unchanged = structuredClone(monday);
  unchanged.week[0] = before.week[0];
  assert.deepEqual(unchanged.week, before.week);
  before = monday;
  elements.get('workout-day').listeners.change({ target: { value: '2' } });
  elements.get('week').listeners.change({ target: {
    dataset: { swapDay: '2', swapSession: '0', swapExercise: '0' },
    value: choice.id,
  } });
  const after = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.equal(after.week[2].sessions[0].exercises[0].name, choice.name);
  assert.match(elements.get('week').innerHTML, /your choice/);
  const swapped = JSON.parse(JSON.stringify(after));
  // Moving Monday to Tuesday must not be undone by recovery-spacing rules.
  vm.runInContext("setBasePlan([{ type: 'upper', day: 1 }, { type: 'upper', day: 2 }, { type: 'upper', day: 4 }], 'a', storage);", context);
  const moved = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.equal(moved.week[0].sessions.length, 0, 'Monday becomes a rest day immediately');
  assert.equal(moved.week[1].sessions[0].type, 'upper', 'the workout appears on Tuesday');
  assert.deepEqual(moved.week[2], swapped.week[2], 'unchanged Wednesday keeps its swap');
  assert.deepEqual(moved.week[4], swapped.week[4]);
  vm.runInContext('openWorkout()', context);
  assert.equal(vm.runInContext('JSON.stringify(currentResult)', context), JSON.stringify(moved), 'the moved schedule persists on reload');
  vm.runInContext("setBasePlan([{ type: 'upper', day: 0 }, { type: 'upper', day: 2 }, { type: 'upper', day: 4 }], 'a', storage);", context);
  // Restore Monday's manual swap after moving its session back.
  elements.get('workout-day').listeners.change({ target: { value: '0' } });
  swap(0);
  after.week[2].sessions[0].exercises[0] = before.week[2].sessions[0].exercises[0];
  assert.deepEqual(after.week, before.week, 'all other exercises and sessions are unchanged');
  // Editing the base week (3 days -> 2) updates this week; unchanged days keep their swaps.
  vm.runInContext("setBasePlan([{ type: 'upper', day: 0 }, { type: 'upper', day: 2 }], 'a', storage);", context);
  const edited = JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  assert.equal(edited.week[4].sessions.length, 0, 'the removed Friday workout is gone this week');
  assert.deepEqual(edited.week[0], swapped.week[0]);
  assert.deepEqual(edited.week[2], swapped.week[2]);
  const saved = JSON.stringify(edited);
  vm.runInContext("setBasePlan([{ type: 'upper', day: 0 }, { type: 'upper', day: 2 }], 'a', storage);", context);
  assert.equal(vm.runInContext('JSON.stringify(currentResult)', context), saved, 'reopening an unchanged base week keeps the record');
  vm.runInContext('openWorkout()', context);
  assert.equal(vm.runInContext('JSON.stringify(currentResult)', context), saved);
  elements.get('workout-day').listeners.change({ target: { value: '2' } });
  assert.ok(elements.get('week').innerHTML.includes('data-swap-day="2"'));
  swap(2);
  assert.equal(vm.runInContext('JSON.stringify(currentResult)', context), saved);
  vm.runInContext("setBasePlan([{ type: 'legs', day: 1 }], 'b', storage);", context);
  assert.notEqual(vm.runInContext('JSON.stringify(currentResult)', context), saved);
  clock.setDate(16); // Next Monday gets the new base plan; old record stays stored.
  vm.runInContext("setBasePlan([{ type: 'legs', day: 1 }], 'a', storage);", context);
  assert.equal(vm.runInContext('currentResult.week[2].sessions.length', context), 0);
  assert.equal(JSON.stringify(WW.createWorkoutStore(storage).load('a', '2026-11-09').result), saved);
});

test('any exercise the equipment allows can be added by hand, with base sets and its muscle group', () => {
  assert.equal(addableExercises('full').length, EXERCISES.length, 'a full gym can do the whole catalog');
  assert.ok(addableExercises('home').every((e) => canDo(e, home)));
  assert.ok(addableExercises('home').length < EXERCISES.length);
  assert.deepEqual(addableExercises('unknown'), []);
  const curl = addExercise(byName('Barbell Curl').id, 'full');
  assert.deepEqual(curl, { id: byName('Barbell Curl').id, name: 'Barbell Curl', group: 'upper', sets: 3, addReason: 'Added by you.' });
  assert.equal(addExercise(byName('Back Squat').id, 'full').group, 'lower');
  assert.equal(addExercise(byName('Barbell Curl').id, 'home'), null, 'not possible with that equipment');
  assert.equal(addExercise('unknown', 'full'), null);
});

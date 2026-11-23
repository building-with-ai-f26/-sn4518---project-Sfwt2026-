const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Runs the planner's inline script against a small fake page, on a fixed Friday.
// Pass the `data` of an earlier page to reopen the app on the same device.
function loadPlanner(data = new Map()) {
  const html = fs.readFileSync(require.resolve('../docs/app/index.html'), 'utf8');
  // Skip the PostHog analytics snippet; run the planner's own inline script.
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((s) => !s.includes('posthog'));
  const elements = new Map();
  const documentListeners = {};
  const document = {
    hidden: false,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', hidden: false, listeners: {}, attributes: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        setAttribute(k, v) { this.attributes[k] = v; } });
      return elements.get(id);
    },
    addEventListener(type, listener) { documentListeners[type] = listener; },
  };
  const WW = require('../docs/app/workoutweek.js');
  const clock = new Date(2026, 10, 13, 12); // Friday
  const storage = { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
  const context = vm.createContext({ document, storage, window: {
    addEventListener() {},
    FlexWeek: require('../docs/app/coach.js'),
    FlexWeekWorkoutWeek: { ...WW, calendar: () => WW.calendar(clock),
      canEdit: (week, selected, day) => WW.canEdit(week, selected, day, clock) },
    FlexWeekCatalog: require('../docs/app/exercises.js'),
    FlexWeekWger: require('../docs/app/wger.js'), // set up on load; never called here
    FlexWeekHistory: require('../docs/app/history.js'),
  } });
  vm.runInContext(script, context);
  vm.runInContext("setBasePlan([{ type: 'upper', day: 0 }, { type: 'lower', day: 2 }, { type: 'full', day: 4 }], 'a', storage);", context);
  const el = (id) => elements.get(id) || document.getElementById(id);
  return {
    el, data, documentListeners,
    week: () => el('week').innerHTML,
    days: () => (el('week').innerHTML.match(/class="day"/g) || []).length,
    result: () => vm.runInContext('JSON.stringify(currentResult)', context),
    click: (id) => el(id).listeners.click(),
    pickDay: (day) => el('workout-day').listeners.change({ target: { value: String(day) } }),
    run: (code) => vm.runInContext(code, context),
    // Typing in one of an exercise's boxes, and pressing "Save Logged Day".
    type: (exerciseId, field, value) => el('week').listeners.input({ target: { dataset: { logField: field, logExercise: exerciseId }, value } }),
    save: (day) => el('week').listeners.click({ target: {
      closest: (selector) => (selector === '[data-save-day]' ? { dataset: { saveDay: String(day) } } : null) } }),
    swap: (day, exercise, id) => el('week').listeners.change({ target: {
      dataset: { swapDay: String(day), swapSession: '0', swapExercise: String(exercise) }, value: id } }),
    // Picking from "+ Add exercise…", and pressing an exercise's "✕ Remove".
    add: (day, id) => el('week').listeners.change({ target: { dataset: { addDay: String(day), addSession: '0' }, value: id } }),
    remove: (day, exercise) => el('week').listeners.click({ target: {
      closest: (selector) => (selector === '[data-remove]' ? { dataset: { remove: `${day}-0-${exercise}` } } : null) } }),
  };
}

const FRIDAY = '2026-11-13'; // day 4 of the fixed week of 2026-11-09
const fridayExercises = (page) => JSON.parse(page.result()).week[4].sessions[0].exercises;
const changeType = (page, day, type) => page.el('week').listeners.change({ target: { dataset: { typeDay: String(day) }, value: type } });
const history = (page) => JSON.parse(page.data.get('flexweek:history:a') || 'null');

test('whole-day type replacement uses defaults, clears edits and drafts, survives reload and expires with the week', () => {
  const page = loadPlanner();
  const original = JSON.parse(page.result());
  page.remove(4, 0);
  page.click('mode-log');
  page.type(fridayExercises(page)[0].id, 'reps', '12');
  page.click('mode-modify');
  changeType(page, 4, 'legs');
  const result = JSON.parse(page.result());
  const defaults = require('../docs/app/coach.js').adjustWeek({ basePlan: [{ type: 'legs', day: 4 }], daysAvailable: 1, equipment: 'full', preserveDays: true });
  assert.deepEqual(result.week[4].sessions, defaults.week[4].sessions);
  assert.deepEqual(result.week[0], original.week[0]);
  assert.equal(page.data.has('flexweek:draft:a:2026-11-13'), false);
  assert.equal(result.changes.filter((c) => c.day === 4).length, 1);
  assert.match(page.el('changes').innerHTML, /Changed Fri to Legs/);
  const reopened = loadPlanner(page.data);
  assert.equal(JSON.parse(reopened.result()).week[4].sessions[0].type, 'legs');
  reopened.click('mode-log');
  assert.doesNotMatch(reopened.week(), /value="12"/);
  assert.doesNotMatch(reopened.week(), /data-type-day/);
  reopened.run("workoutStore = WW.createWorkoutStore(storage); workoutStore.load = () => null; openWorkout();");
  assert.equal(JSON.parse(reopened.result()).week[4].sessions[0].type, 'full', 'a week without a saved record uses the base');
});

test('type changes refuse rest, logged, unselected, invalid and log-mode requests', () => {
  const page = loadPlanner();
  assert.match(page.week(), /data-type-day="4"/);
  for (const [day, type] of [[1, 'legs'], [0, 'legs'], [4, 'invalid']]) {
    const before = page.result();
    changeType(page, day, type);
    assert.equal(page.result(), before);
  }
  page.click('mode-log');
  const before = page.result();
  changeType(page, 4, 'legs');
  assert.equal(page.result(), before);
  page.type(fridayExercises(page)[0].id, 'reps', '8');
  page.save(4);
  const saved = page.result();
  const savedHistory = page.data.get('flexweek:history:a');
  page.click('mode-modify');
  changeType(page, 4, 'legs');
  assert.equal(page.result(), saved);
  assert.equal(page.data.get('flexweek:history:a'), savedHistory);
  assert.doesNotMatch(page.week(), /data-type-day/);
});

test('saving base workout discards temporary types even when base is unchanged; logged days stay final', () => {
  const page = loadPlanner();
  const base = "[{ type: 'upper', day: 0 }, { type: 'lower', day: 2 }, { type: 'full', day: 4 }]";
  changeType(page, 4, 'legs');
  page.run(`setBasePlan(${base}, 'a', storage, true);`);
  assert.equal(JSON.parse(page.result()).week[4].sessions[0].type, 'full');
  assert.doesNotMatch(page.el('changes').innerHTML, /Changed Fri/);
  page.pickDay(4);
  changeType(page, 4, 'pull');
  page.run("setBasePlan([{ type: 'push', day: 0 }, { type: 'lower', day: 2 }, { type: 'full', day: 4 }], 'a', storage);");
  assert.equal(JSON.parse(page.result()).week[4].sessions[0].type, 'full', 'changed base detected on reopening');
  page.pickDay(4);
  changeType(page, 4, 'legs');
  page.click('mode-log');
  page.type(fridayExercises(page)[0].id, 'reps', '8');
  page.save(4);
  page.run(`setBasePlan(${base}, 'a', storage, true);`);
  assert.equal(JSON.parse(page.result()).week[4].sessions[0].type, 'legs');
});

test('the page opens in "Modify Current Week" with the whole week and swap menus', () => {
  const page = loadPlanner();
  assert.equal(page.days(), 7);
  assert.match(page.week(), /Switch to/);
  assert.match(page.week(), /data-swap-day="4"/);
  assert.equal(page.el('changes-card').hidden, false);
});

test('"Log Today\'s Exercise" shows only the selected day, with its swap menus', () => {
  const page = loadPlanner();
  page.click('mode-log');
  assert.equal(page.el('mode-log').attributes['aria-pressed'], 'true');
  assert.equal(page.el('mode-modify').attributes['aria-pressed'], 'false');
  assert.equal(page.el('changes-card').hidden, true, 'the planning reasons are hidden while logging');
  assert.match(page.el('mode-hint').textContent, /Only that day's workout/);
  assert.equal(page.days(), 1);
  assert.match(page.week(), /Fri/);
  assert.match(page.week(), /data-swap-day="4"/);
  assert.doesNotMatch(page.week(), /Selected workout/);
  assert.match(page.week(), /class="info-btn"/, 'exercise info stays available');
  page.pickDay(1); // Tuesday is a rest day in this base workout
  assert.equal(page.days(), 1);
  assert.match(page.week(), /Rest day\. Nothing to log\./);
});

test('a swap while logging changes the selected day and is saved, like in Modify', () => {
  const page = loadPlanner();
  const exercise = JSON.parse(page.result()).week[4].sessions[0].exercises[0];
  const choice = require('../docs/app/coach.js').exerciseAlternatives(exercise.id, 'full')[0];
  page.click('mode-log');
  page.el('week').listeners.change({ target: {
    dataset: { swapDay: '4', swapSession: '0', swapExercise: '0' }, value: choice.id,
  } });
  assert.equal(JSON.parse(page.result()).week[4].sessions[0].exercises[0].id, choice.id);
  const saved = JSON.parse(page.data.get('flexweek:workouts:a:2026-11-09'));
  assert.equal(saved.result.week[4].sessions[0].exercises[0].id, choice.id);
  assert.equal(page.days(), 1, 'still logging the same day after the swap');
});

test('the mode survives redraws and switching back restores the planning view', () => {
  const page = loadPlanner();
  const planning = page.week();
  page.click('mode-log');
  page.documentListeners.visibilitychange(); // coming back to the tab redraws the week
  assert.equal(page.days(), 1);
  page.click('mode-modify');
  assert.equal(page.week(), planning);
  assert.equal(page.el('changes-card').hidden, false);
  assert.match(page.el('mode-hint').textContent, /this week only/);
});

test('logging shows Sets, Reps and Weight boxes with "–" the first time, and a Save button', () => {
  const page = loadPlanner();
  assert.doesNotMatch(page.week(), /data-log-field|data-save-day/, 'Modify mode has no boxes');
  page.click('mode-log');
  const [first] = fridayExercises(page);
  for (const field of ['sets', 'reps', 'weight']) {
    assert.match(page.week(), new RegExp(`data-log-field="${field}" data-log-exercise="${first.id}" value="" placeholder="–"`));
  }
  assert.match(page.week(), /data-save-day="4"/);
  page.pickDay(1); // rest day: nothing to save
  assert.doesNotMatch(page.week(), /data-save-day/);
});

test('the grey placeholder is the last logged result of the exercise now in the row, also after a swap', () => {
  const data = new Map();
  let page = loadPlanner(data);
  const [first] = fridayExercises(page);
  const choice = require('../docs/app/coach.js').exerciseAlternatives(first.id, 'full')[0];
  data.set('flexweek:history:a', JSON.stringify({ version: 1, days: {
    '2026-11-02': { exercises: [{ id: choice.id, name: choice.name, sets: 4, reps: 6, weight: 95 }] },
  } }));
  page = loadPlanner(data);
  page.click('mode-log');
  assert.match(page.week(), new RegExp(`data-log-exercise="${first.id}" value="" placeholder="–"`));
  page.swap(4, 0, choice.id);
  assert.equal(fridayExercises(page)[0].id, choice.id);
  assert.match(page.week(), new RegExp(`data-log-field="sets" data-log-exercise="${choice.id}" value="" placeholder="4"`));
  assert.match(page.week(), new RegExp(`data-log-field="reps" data-log-exercise="${choice.id}" value="" placeholder="6"`));
  assert.match(page.week(), new RegExp(`data-log-field="weight" data-log-exercise="${choice.id}" value="" placeholder="95"`));
});

test('typed numbers survive a reload, and saving stores only exercises with reps or weight above 0', () => {
  const data = new Map();
  let page = loadPlanner(data);
  page.click('mode-log');
  const [a, b, c] = fridayExercises(page);
  page.type(a.id, 'reps', '8');
  page.type(a.id, 'weight', '135');
  page.type(b.id, 'sets', '4');
  page.type(b.id, 'reps', '12'); // bodyweight: no weight
  page.type(c.id, 'reps', '0');
  page.type(c.id, 'weight', '0'); // both 0: skipped
  page = loadPlanner(data); // reopen the app
  page.click('mode-log');
  assert.match(page.week(), new RegExp(`data-log-field="weight" data-log-exercise="${a.id}" value="135"`));
  page.save(4);
  const day = history(page).days[FRIDAY];
  assert.deepEqual(day.exercises, [
    { id: a.id, name: a.name, sets: a.sets, reps: 8, weight: 135 }, // blank Sets: the planned sets
    { id: b.id, name: b.name, sets: 4, reps: 12, weight: 0 },
  ]);
  assert.equal(day.day, 4);
  assert.equal(data.has(`flexweek:draft:a:${FRIDAY}`), false, 'the draft is cleared');
});

test('a saved day is final: no boxes, no Save button and no swaps, in both modes', () => {
  const page = loadPlanner();
  page.click('mode-log');
  const [a, b] = fridayExercises(page);
  page.type(a.id, 'reps', '8');
  page.type(a.id, 'weight', '135');
  page.save(4);
  assert.match(page.week(), /Logged ✓/);
  assert.match(page.week(), /3 sets × 8 reps · 135 lb/);
  assert.match(page.week(), /Skipped/);
  assert.match(page.week(), new RegExp(`saved for ${FRIDAY} and is final`));
  assert.doesNotMatch(page.week(), /data-log-field|data-save-day|data-swap-day="4"/);
  const before = page.result();
  const choice = require('../docs/app/coach.js').exerciseAlternatives(b.id, 'full')[0];
  page.swap(4, 1, choice.id);
  assert.equal(page.result(), before, 'a swap aimed at the saved day is refused');
  page.save(4);
  assert.equal(history(page).days[FRIDAY].exercises.length, 1, 'saving again changes nothing');
  page.click('mode-modify');
  assert.match(page.week(), /Logged ✓/);
  assert.doesNotMatch(page.week(), /data-swap-day="4"/);
});

test('bad numbers or an empty day show a message and save nothing', () => {
  const page = loadPlanner();
  page.click('mode-log');
  const [a] = fridayExercises(page);
  page.save(4);
  assert.match(page.week(), /Enter Reps or Weight for at least one exercise/);
  page.type(a.id, 'reps', '8.5');
  page.save(4);
  assert.match(page.week(), new RegExp(`${a.name}: Reps must be a whole number from 0 to 100\.`));
  assert.equal(history(page), null);
  page.type(a.id, 'reps', '8');
  page.save(4);
  assert.equal(history(page).days[FRIDAY].exercises[0].reps, 8);
  assert.doesNotMatch(page.week(), /role="alert"/);
});

test('editing the base workout never changes a logged day', () => {
  const page = loadPlanner();
  page.click('mode-log');
  const logged = fridayExercises(page);
  page.type(logged[0].id, 'reps', '8');
  page.save(4);
  page.run("setBasePlan([{ type: 'upper', day: 0 }, { type: 'lower', day: 2 }, { type: 'lower', day: 4 }], 'a', storage);");
  assert.deepEqual(fridayExercises(page), logged, 'Friday stays as it was done');
  page.run("setBasePlan([{ type: 'upper', day: 0 }, { type: 'legs', day: 2 }, { type: 'full', day: 4 }], 'a', storage);");
  assert.equal(JSON.parse(page.result()).week[2].sessions[0].type, 'legs', 'days not logged still follow the base workout');
});

test('both modes show Remove buttons and an Add menu on the selected day only', () => {
  const page = loadPlanner(); // Friday is selected
  for (const mode of ['mode-modify', 'mode-log']) {
    page.click(mode);
    assert.match(page.week(), /data-remove="4-0-0"/, mode);
    assert.match(page.week(), /data-add-day="4" data-add-session="0"/, mode);
    assert.doesNotMatch(page.week(), /data-remove="0-|data-add-day="0"/, 'other days stay read-only');
  }
  page.pickDay(1); // rest day: adding there would create a new workout day (a later step)
  assert.doesNotMatch(page.week(), /data-add-day|data-remove/);
  page.pickDay(4);
  const ids = fridayExercises(page).map((e) => e.id);
  const menu = page.week().slice(page.week().indexOf('data-add-day'));
  assert.ok(ids.every((id) => !menu.includes(`value="${id}"`)), 'exercises already in the day are not offered');
  assert.match(menu, /<optgroup label="Chest">/);
});

test('adding while logging puts the exercise at the end, with its own boxes, and lists the edit', () => {
  const page = loadPlanner();
  page.click('mode-log');
  const curl = require('../docs/app/exercises.js').EXERCISES.find((e) => e.name === 'Barbell Curl');
  const before = fridayExercises(page).length;
  page.add(4, curl.id);
  const after = fridayExercises(page);
  assert.equal(after.length, before + 1);
  assert.deepEqual(after.at(-1), { id: curl.id, name: 'Barbell Curl', group: 'upper', sets: 3, addReason: 'Added by you.' });
  assert.match(page.week(), new RegExp(`data-log-field="reps" data-log-exercise="${curl.id}"`));
  assert.match(page.week(), /Added by you\./);
  assert.ok(!page.week().slice(page.week().indexOf('data-add-day')).includes(`value="${curl.id}"`), 'no second copy offered');
  page.add(4, curl.id);
  assert.equal(fridayExercises(page).length, before + 1, 'adding it twice is refused');
  const saved = JSON.parse(page.data.get('flexweek:workouts:a:2026-11-09')).result;
  assert.equal(saved.week[4].sessions[0].exercises.at(-1).id, curl.id, 'saved for this week');
  assert.deepEqual(saved.changes.filter((c) => c.kind === 'manual').map((c) => c.text), ['Added Barbell Curl to Fri Full Body.']);
  page.click('mode-modify');
  assert.match(page.el('changes').innerHTML, /Your edit<\/span>Added Barbell Curl to Fri Full Body\./);
});

test('removing keeps at least one exercise, and add/remove of the same exercise cancel out', () => {
  const page = loadPlanner();
  const [first, ...rest] = fridayExercises(page);
  page.remove(4, 0);
  assert.deepEqual(fridayExercises(page).map((e) => e.id), rest.map((e) => e.id));
  assert.match(page.el('changes').innerHTML, new RegExp(`Removed ${first.name} from Fri Full Body\.`));
  page.add(4, first.id); // put it back
  const manual = () => JSON.parse(page.result()).changes.filter((c) => c.kind === 'manual');
  assert.deepEqual(manual(), [], 'adding back what was removed leaves no edit listed');
  while (fridayExercises(page).length > 1) page.remove(4, 0);
  assert.doesNotMatch(page.week(), /data-remove="4-/, 'the last exercise has no Remove button');
  const last = page.result();
  page.remove(4, 0);
  assert.equal(page.result(), last, 'and removing it anyway is refused');
});

test('a logged day refuses adds and removes; base workout edits keep hand edits on unchanged days', () => {
  const page = loadPlanner();
  const curl = require('../docs/app/exercises.js').EXERCISES.find((e) => e.name === 'Barbell Curl');
  page.add(4, curl.id);
  page.run("setBasePlan([{ type: 'upper', day: 0 }, { type: 'legs', day: 2 }, { type: 'full', day: 4 }], 'a', storage);");
  assert.equal(fridayExercises(page).at(-1).id, curl.id, 'Friday is still Full Body, so the added curl stays');
  assert.match(page.el('changes').innerHTML, /Added Barbell Curl to Fri Full Body\./);
  page.pickDay(4);
  page.click('mode-log');
  page.type(curl.id, 'reps', '10');
  page.save(4);
  const done = page.result();
  page.add(4, require('../docs/app/exercises.js').EXERCISES.find((e) => e.name === 'Hammer Curl').id);
  page.remove(4, 0);
  assert.equal(page.result(), done);
  assert.doesNotMatch(page.week(), /data-remove|data-add-day/);
});

test('saved workout text from storage is shown as text, never run as HTML', () => {
  // Another page on the same github.io origin could write this device's FlexWeek storage.
  const first = loadPlanner();
  const key = 'flexweek:workouts:a:2026-11-09';
  const record = JSON.parse(first.data.get(key));
  const attack = '<img src=x onerror=alert(1)>';
  record.result.week[4].sessions[0].exercises[0].name = attack;
  record.result.week[4].sessions[0].exercises[0].swapReason = attack;
  record.result.week[4].sessions[0].label = attack;
  record.result.week[4].activities = [attack];
  record.result.changes.push({ kind: 'manual', day: 4, text: attack });
  record.result.notes.push(attack);
  first.data.set(key, JSON.stringify(record));
  const page = loadPlanner(first.data);
  page.pickDay(0); // Friday not selected: its label is plain text, not the type menu
  const shown = page.week() + page.el('changes').innerHTML;
  assert.doesNotMatch(shown, /<img/);
  assert.match(shown, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

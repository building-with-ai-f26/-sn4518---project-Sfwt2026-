const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Runs the planner's inline script against a small fake page, on a fixed Friday.
function loadPlanner() {
  const html = fs.readFileSync(require.resolve('../prototype/index.html'), 'utf8');
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
  const WW = require('../prototype/workoutweek.js');
  const clock = new Date(2026, 10, 13, 12); // Friday
  const data = new Map();
  const storage = { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, v) };
  const context = vm.createContext({ document, storage, window: {
    addEventListener() {},
    FlexWeek: require('../prototype/coach.js'),
    FlexWeekWorkoutWeek: { ...WW, calendar: () => WW.calendar(clock),
      canEdit: (week, selected, day) => WW.canEdit(week, selected, day, clock) },
    FlexWeekCatalog: require('../prototype/exercises.js'),
    FlexWeekWger: require('../prototype/wger.js'), // set up on load; never called here
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
  };
}

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
  const choice = require('../prototype/coach.js').exerciseAlternatives(exercise.id, 'full')[0];
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

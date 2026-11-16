const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Runs the planner's inline script against a small fake page and returns handles to poke it.
function loadPlanner() {
  const html = fs.readFileSync(require.resolve('../prototype/index.html'), 'utf8');
  // Skip the PostHog analytics snippet; run the planner's own inline script.
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((s) => !s.includes('posthog'));
  const page = { focused: null, documentListeners: {} };
  const element = () => {
    const el = {
      innerHTML: '', textContent: '', hidden: true, listeners: {}, attributes: {},
      style: { setProperty(k, v) { this[k] = v; } },
      addEventListener(type, listener) { el.listeners[type] = listener; },
      setAttribute(k, v) { el.attributes[k] = v; },
      focus() { page.focused = el; },
      contains: (node) => node === el,
    };
    return el;
  };
  const elements = new Map();
  const document = {
    documentElement: { clientWidth: 1024 },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    addEventListener(type, listener) { page.documentListeners[type] = listener; },
  };
  const data = new Map();
  const storage = { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, v) };
  const context = vm.createContext({ document, storage, window: {
    scrollX: 0, scrollY: 500, addEventListener() {},
    FlexWeek: require('../prototype/coach.js'),
    FlexWeekWorkoutWeek: require('../prototype/workoutweek.js'),
  } });
  vm.runInContext(script, context);
  vm.runInContext("setBasePlan([{ type: 'upper', day: 0 }, { type: 'legs', day: 2 }], 'a', storage);", context);
  const $ = (id) => document.getElementById(id);
  const result = () => JSON.parse(vm.runInContext('JSON.stringify(currentResult)', context));
  // A fake ⓘ button as the browser would hand it to the click handler.
  const infoButton = (info) => {
    const button = element();
    button.dataset = { info };
    button.getBoundingClientRect = () => ({ left: 200, bottom: 300, width: 22 });
    return button;
  };
  const click = (button) => {
    const event = { target: { closest: () => button } };
    $('week').listeners.click(event);
    page.documentListeners.click({ target: button });
  };
  return { $, page, result, infoButton, click };
}

test('every exercise on every day gets an info button pointing at it', () => {
  const { $, result } = loadPlanner();
  const html = $('week').innerHTML;
  const expected = result().week.flatMap((d, di) => d.sessions.flatMap((s, si) =>
    s.exercises.map((e, xi) => ({ key: `${di}-${si}-${xi}`, name: e.name }))));
  assert.ok(expected.length > 0);
  assert.equal((html.match(/class="info-btn"/g) || []).length, expected.length);
  for (const { key, name } of expected) {
    assert.ok(html.includes(`data-info="${key}" aria-label="About ${name}" aria-expanded="false"`), key);
  }
});

test('clicking an info button opens the bubble with that exercise and placeholders', () => {
  const { $, page, result, infoButton, click } = loadPlanner();
  const exercise = result().week[2].sessions[0].exercises[1];
  const button = infoButton('2-0-1');
  click(button);
  assert.equal($('exercise-info').hidden, false);
  assert.equal($('exercise-info-title').textContent, exercise.name);
  assert.equal($('exercise-info-text').textContent, 'Description coming soon.');
  assert.equal($('exercise-info-gif').textContent, 'GIF coming soon');
  assert.equal(button.attributes['aria-expanded'], 'true');
  assert.equal($('exercise-info').style.top, '808px', 'just under the button, in page coordinates');
  assert.equal(page.focused, $('exercise-info-close'));
});

test('the bubble closes on a second click, outside click, Esc, the close button and re-render', () => {
  const { $, page, infoButton, click } = loadPlanner();
  const button = infoButton('0-0-0');
  const isOpen = () => $('exercise-info').hidden === false;

  click(button);
  click(button);
  assert.ok(!isOpen(), 'second click on the same button');
  assert.equal(button.attributes['aria-expanded'], 'false');

  click(button);
  page.documentListeners.click({ target: $('exercise-info') });
  assert.ok(isOpen(), 'a click inside the bubble keeps it open');
  page.documentListeners.click({ target: {} });
  assert.ok(!isOpen(), 'click outside');

  click(button);
  page.documentListeners.keydown({ key: 'Escape' });
  assert.ok(!isOpen(), 'Esc');
  assert.equal(page.focused, button, 'focus goes back to the button');

  click(button);
  $('exercise-info-close').listeners.click();
  assert.ok(!isOpen(), 'close button');

  click(button);
  const other = infoButton('0-0-1');
  click(other);
  assert.ok(isOpen(), 'another button moves the bubble');
  assert.equal(button.attributes['aria-expanded'], 'false');
  assert.equal(other.attributes['aria-expanded'], 'true');

  $('workout-day').listeners.change({ target: { value: '2' } });
  assert.ok(!isOpen(), 're-render (changing the day) closes it');
});

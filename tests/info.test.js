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
  // A copy of the catalog, so a test can decide which exercises have a wger match.
  const catalog = { BY_ID: {} };
  Object.values(require('../prototype/exercises.js').BY_ID).forEach((e) => { catalog.BY_ID[e.id] = { ...e }; });
  // A fake fetch instead of the network: it records each URL and waits for the test to answer or fail it.
  const net = { calls: [], waiting: [] };
  const fetch = (url) => {
    net.calls.push(url);
    return new Promise((resolve, reject) => net.waiting.push({ resolve, reject }));
  };
  net.answer = (i, html) => net.waiting[i].resolve({ ok: true, status: 200, json: async () => ({ results: [{ description: html }] }) });
  net.fail = (i) => net.waiting[i].reject(new Error('offline'));
  const context = vm.createContext({ document, storage, fetch, window: {
    scrollX: 0, scrollY: 500, addEventListener() {},
    FlexWeek: require('../prototype/coach.js'),
    FlexWeekWorkoutWeek: require('../prototype/workoutweek.js'),
    FlexWeekCatalog: catalog,
    FlexWeekWger: require('../prototype/wger.js'),
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
  return { $, page, result, infoButton, click, catalog, net };
}

// Lets answered (or failed) fake requests reach the page before the test looks at it.
const settle = () => new Promise((resolve) => setImmediate(resolve));
const ownText = (entry) => entry.instructions.join('\n\n');

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

test('clicking an info button opens the bubble, shows Loading…, then the description from wger', async () => {
  const { $, page, result, infoButton, click, catalog, net } = loadPlanner();
  const exercise = result().week[2].sessions[0].exercises[1];
  catalog.BY_ID[exercise.id].wgerId = 73;
  const button = infoButton('2-0-1');
  click(button);
  assert.equal($('exercise-info').hidden, false);
  assert.equal($('exercise-info-title').textContent, exercise.name);
  assert.equal($('exercise-info-text').textContent, 'Loading…');
  assert.equal($('exercise-info-source').hidden, true);
  assert.equal($('exercise-info-gif').textContent, 'GIF coming soon');
  assert.equal(button.attributes['aria-expanded'], 'true');
  assert.equal($('exercise-info').style.top, '808px', 'just under the button, in page coordinates');
  assert.equal(page.focused, $('exercise-info-close'));
  assert.equal(net.calls.length, 1);
  assert.ok(net.calls[0].includes('exercise-translation') && net.calls[0].endsWith('exercise=73'), net.calls[0]);

  net.answer(0, '<p>Push the <em>bar</em> up.</p><script>alert(1)</script>');
  await settle();
  assert.equal($('exercise-info-text').textContent, 'Push the bar up.', 'plain text, no HTML');
  assert.equal($('exercise-info-source').hidden, false, 'wger is credited');

  click(button); // close
  click(button); // open again
  await settle();
  assert.equal($('exercise-info-text').textContent, 'Push the bar up.');
  assert.equal(net.calls.length, 1, 'the second open reuses the cached answer');
});

test('an exercise with no wger match shows our catalog instructions at once, without a network call', () => {
  const { $, result, infoButton, click, catalog, net } = loadPlanner();
  const exercise = result().week[0].sessions[0].exercises[0];
  catalog.BY_ID[exercise.id].wgerId = null;
  click(infoButton('0-0-0'));
  assert.equal($('exercise-info-text').textContent, ownText(catalog.BY_ID[exercise.id]));
  assert.equal($('exercise-info-source').hidden, true);
  assert.equal(net.calls.length, 0);
});

test('when the wger call fails or wger has no text, the bubble falls back to our catalog instructions', async () => {
  const { $, result, infoButton, click, catalog, net } = loadPlanner();
  const exercise = result().week[0].sessions[0].exercises[0];
  catalog.BY_ID[exercise.id].wgerId = 73;
  const button = infoButton('0-0-0');

  click(button);
  net.fail(0);
  await settle();
  assert.equal($('exercise-info-text').textContent, ownText(catalog.BY_ID[exercise.id]), 'call failed');
  assert.equal($('exercise-info-source').hidden, true);

  click(button); // close
  click(button); // open again: a failed call is not cached, so the page asks wger again
  assert.equal(net.calls.length, 2);
  net.answer(1, '<p> </p>');
  await settle();
  assert.equal($('exercise-info-text').textContent, ownText(catalog.BY_ID[exercise.id]), 'wger has no text');
  assert.equal($('exercise-info-source').hidden, true);
});

test('a late wger answer does not overwrite a bubble that has moved on or closed', async () => {
  const { $, result, infoButton, click, catalog, net } = loadPlanner();
  const [first, second] = result().week[0].sessions[0].exercises;
  catalog.BY_ID[first.id].wgerId = 73;
  catalog.BY_ID[second.id].wgerId = null;

  click(infoButton('0-0-0')); // asks wger, shows Loading…
  click(infoButton('0-0-1')); // the bubble moves to the second exercise before wger answers
  net.answer(0, '<p>Text for the first exercise</p>');
  await settle();
  assert.equal($('exercise-info-title').textContent, second.name);
  assert.equal($('exercise-info-text').textContent, ownText(catalog.BY_ID[second.id]));
  assert.equal($('exercise-info-source').hidden, true);

  catalog.BY_ID[second.id].wgerId = 184;
  const button = infoButton('0-0-1');
  click(button); // asks wger for the second exercise
  click(button); // closed before the answer arrives
  $('exercise-info-text').textContent = 'left as it was';
  net.answer(1, '<p>Too late</p>');
  await settle();
  assert.equal($('exercise-info').hidden, true);
  assert.equal($('exercise-info-text').textContent, 'left as it was');
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

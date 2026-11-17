const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const H = require('../prototype/history.js');

function page() {
  const html = fs.readFileSync(require.resolve('../prototype/index.html'), 'utf8');
  const script = html.slice(html.indexOf('      function historyDate('), html.indexOf('      function openProfile('));
  const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
  const elements = new Map();
  const $ = (id) => {
    if (!elements.has(id)) elements.set(id, { listeners: {}, open: false,
      addEventListener(type, callback) { this.listeners[type] = callback; },
      showModal() { this.open = true; }, close() { this.open = false; },
      getBoundingClientRect() { return { left: 10, top: 10, right: 500, bottom: 500 }; } });
    return elements.get(id);
  };
  const context = vm.createContext({ $, H, storage, editingId: 'a',
    SESSION_TYPES: require('../prototype/coach.js').SESSION_TYPES,
    esc: (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') });
  vm.runInContext(script, context);
  return { $, store: H.createHistoryStore(storage), context,
    open(date) { $('history-list').listeners.click({ target: { closest: () => ({ dataset: { historyDate: date } }) } }); } };
}

test('clicking saved dates opens their own results, only positive reps, without changing history', () => {
  const p = page();
  const exercises = [
    { id: 'bench', name: '<Bench>', sets: 3, reps: 8, weight: 135 },
    { id: 'skip', name: 'Zero reps', sets: 3, reps: 0, weight: 100 },
    { id: 'body', name: 'Push up', sets: 2, reps: 10, weight: 0 },
  ];
  p.store.saveDay('a', '2026-11-16', { workoutTypes: ['upper'], exercises });
  p.store.saveDay('a', '2026-11-17', { exercises: [exercises[1]] });
  p.store.saveDay('b', '2026-11-18', { exercises });
  const before = p.store.loadDay('a', '2026-11-16');
  p.open('2026-11-16');
  assert.equal(p.$('history-dialog').open, true);
  assert.match(p.$('history-dialog-title').textContent, /Nov 16, 2026/);
  assert.equal(p.$('history-dialog-type').textContent, 'Upper');
  const results = p.$('history-dialog-results').innerHTML;
  assert.match(results, /&lt;Bench&gt;/);
  assert.match(results, /3 sets &times; 8 reps &middot; 135 lb/);
  assert.match(results, /2 sets &times; 10 reps &middot; 0 lb/);
  assert.doesNotMatch(results, /Zero reps|input|data-swap/);
  assert.deepEqual(p.store.loadDay('a', '2026-11-16'), before);
  p.$('history-dialog-close').listeners.click();
  assert.equal(p.$('history-dialog').open, false);
  p.open('2026-11-18');
  assert.equal(p.$('history-dialog').open, false, 'another profile date cannot be opened');
  p.open('2026-11-17');
  assert.equal(p.$('history-dialog-type').textContent, 'Logged workout');
  assert.match(p.$('history-dialog-results').innerHTML, /No exercises with more than 0 reps/);
  const dialog = p.$('history-dialog');
  dialog.listeners.click({ target: dialog, clientX: 20, clientY: 20 });
  assert.equal(dialog.open, true, 'clicking inner padding keeps it open');
  dialog.listeners.click({ target: dialog, clientX: 0, clientY: 0 });
  assert.equal(dialog.open, false, 'clicking backdrop closes it');
});

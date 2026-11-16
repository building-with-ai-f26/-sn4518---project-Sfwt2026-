// Deterministic tests for the wger client (prototype/wger.js). They use a fake fetch: no network.
// Run from the repo root:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { createWgerClient, htmlToText } = require('../prototype/wger.js');

// A fake fetch that records the URLs it was asked for and answers like wger would.
function fakeFetch(answer) {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    const a = typeof answer === 'function' ? answer(calls.length) : answer;
    if (a instanceof Error) throw a;
    return { ok: a.status === undefined || a.status === 200, status: a.status || 200, json: async () => a.body };
  };
  return { fetchFn, calls };
}
const wgerAnswer = (description) => ({ body: { count: 1, results: [{ exercise: 73, language: 2, description }] } });

test('htmlToText: paragraphs, bullet lists and inline tags become plain text', () => {
  const html = '<p>Lay down on a bench.\nPush the bar up.</p>\n<p>Use a <em>spotter</em> &amp; stay <strong>safe</strong>.</p>\n'
    + '<ul>\n<li>wide grip: outer chest</li>\n<li>narrow grip:&nbsp;triceps</li>\n</ul>\n';
  assert.equal(htmlToText(html),
    'Lay down on a bench. Push the bar up.\n\nUse a spotter & stay safe.\n\n• wide grip: outer chest\n• narrow grip: triceps');
});

test('htmlToText: numbered lists keep their numbers', () => {
  assert.equal(htmlToText('<p>Steps:</p><ol><li>Sit down</li><li>Press</li></ol><p>Repeat.</p>'),
    'Steps:\n\n1. Sit down\n2. Press\n\nRepeat.');
});

test('htmlToText: no tag survives, and script contents are dropped', () => {
  const text = htmlToText('<p onclick="x()">Hi<script>alert(1)</script> <img src=x onerror=alert(2)>there</p><style>p{}</style>');
  assert.equal(text, 'Hi there');
  assert.ok(!/[<>]/.test(htmlToText('<p>a</p><iframe src="x"></iframe><a href="javascript:x">b</a>')));
});

test('htmlToText: empty, missing and tag-only input give an empty string', () => {
  assert.equal(htmlToText(''), '');
  assert.equal(htmlToText(undefined), '');
  assert.equal(htmlToText(null), '');
  assert.equal(htmlToText('<p> </p>\n'), '');
});

test('description asks the English exercise-translation endpoint for that wger id', async () => {
  const { fetchFn, calls } = fakeFetch(wgerAnswer('<p>Push the bar up.</p>'));
  const text = await createWgerClient(fetchFn).description(73);
  assert.equal(text, 'Push the bar up.');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://wger.de/api/v2/exercise-translation/?format=json&language=2&exercise=73');
  assert.ok(calls[0].options.signal, 'the request has a timeout signal');
});

test('each exercise is fetched once: repeat and overlapping calls reuse the first request', async () => {
  const { fetchFn, calls } = fakeFetch(wgerAnswer('<p>Text</p>'));
  const client = createWgerClient(fetchFn);
  const [a, b] = await Promise.all([client.description(73), client.description(73)]);
  const c = await client.description(73);
  assert.deepEqual([a, b, c], ['Text', 'Text', 'Text']);
  assert.equal(calls.length, 1);
  await client.description(184);
  assert.equal(calls.length, 2, 'a different exercise is its own request');
});

test('no English description gives an empty string, and that answer is cached too', async () => {
  const none = fakeFetch({ body: { count: 0, results: [] } });
  const client = createWgerClient(none.fetchFn);
  assert.equal(await client.description(5), '');
  assert.equal(await client.description(5), '');
  assert.equal(none.calls.length, 1);
  assert.equal(await createWgerClient(fakeFetch(wgerAnswer('')).fetchFn).description(5), '');
});

test('a failed call rejects and is not cached, so the next call tries again', async () => {
  const offline = fakeFetch((n) => (n === 1 ? new Error('offline') : wgerAnswer('<p>Back online</p>')));
  const client = createWgerClient(offline.fetchFn);
  await assert.rejects(client.description(73), /offline/);
  assert.equal(await client.description(73), 'Back online');
  assert.equal(offline.calls.length, 2);

  const broken = fakeFetch((n) => (n === 1 ? { status: 500, body: {} } : wgerAnswer('<p>Fixed</p>')));
  const second = createWgerClient(broken.fetchFn);
  await assert.rejects(second.description(73), /500/);
  assert.equal(await second.description(73), 'Fixed');
});

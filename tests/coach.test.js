// Deterministic tests for the FlexWeek rules engine.
// Run from the repo root:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { adjustWeek } = require('../prototype/coach.js');

const MON = 0, TUE = 1, WED = 2, THU = 3, FRI = 4, SAT = 5;
const ULF = [
  { type: 'upper', day: MON },
  { type: 'lower', day: WED },
  { type: 'full', day: FRI },
];

const sessionsOn = (r, d) => r.week[d].sessions;
const allSessions = (r) => r.week.flatMap((w, d) => w.sessions.map((s) => ({ ...s, day: d })));

test('no constraints → base plan unchanged', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 3, activities: [], equipment: 'full' });
  assert.equal(r.changes.length, 0);
  assert.equal(sessionsOn(r, MON)[0].label, 'Upper');
  assert.equal(sessionsOn(r, WED)[0].label, 'Lower');
  assert.equal(sessionsOn(r, FRI)[0].label, 'Full Body');
  assert.match(r.notes.join(' '), /No changes needed/);
});

test('soccer Thursday → no lifting Thu, legs not the day before', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 3, activities: [{ type: 'soccer', day: THU }], equipment: 'full' });
  assert.equal(sessionsOn(r, THU).length, 0);
  const wed = sessionsOn(r, WED);
  assert.ok(wed.every((s) => !s.groups.includes('lower')), 'no leg work on Wed');
  assert.ok(r.changes.some((c) => c.kind === 'move' && /Lower Wed →/.test(c.text) && /Soccer on Thu/.test(c.text)));
  // leg volume trimmed because soccer loads legs
  const lower = allSessions(r).find((s) => s.label === 'Lower');
  assert.ok(lower.exercises.every((e) => e.sets === 2));
  const upper = allSessions(r).find((s) => s.label === 'Upper');
  assert.ok(upper.exercises.every((e) => e.sets === 3));
});

test('every change has a one-line reason', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 2, activities: [{ type: 'soccer', day: THU }], equipment: 'home' });
  assert.ok(r.changes.length > 0);
  for (const c of r.changes) {
    assert.ok(c.text.length > 10);
    assert.ok(!c.text.includes('\n'));
  }
});

test('Upper/Lower/Full with 2 days → two Full Body sessions', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 2, activities: [], equipment: 'full' });
  const s = allSessions(r);
  assert.equal(s.length, 2);
  assert.ok(s.every((x) => x.type === 'full'));
  assert.ok(r.changes.some((c) => c.kind === 'merge'));
});

test('Push/Pull/Legs with 2 days → Upper (Push + Pull) + Legs', () => {
  const ppl = [{ type: 'push', day: MON }, { type: 'pull', day: WED }, { type: 'legs', day: FRI }];
  const r = adjustWeek({ basePlan: ppl, daysAvailable: 2, activities: [], equipment: 'full' });
  const labels = allSessions(r).map((s) => s.label).sort();
  assert.deepEqual(labels, ['Legs', 'Upper (Push + Pull)']);
});

test('1 day → a single Full Body session', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 1, activities: [], equipment: 'full' });
  const s = allSessions(r);
  assert.equal(s.length, 1);
  assert.equal(s[0].type, 'full');
});

test('0 days → rest week', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 0, activities: [], equipment: 'full' });
  assert.equal(allSessions(r).length, 0);
  assert.match(r.changes[0].text, /No training days/);
});

test('home equipment swaps barbell lifts', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 3, activities: [], equipment: 'home' });
  const lower = allSessions(r).find((s) => s.label === 'Lower');
  assert.deepEqual(lower.exercises.map((e) => e.name),
    ['Bulgarian Split Squat', 'Stiff-Legged Dumbbell Deadlift', 'Dumbbell Lunge', 'Standing Dumbbell Calf Raise']);
  assert.ok(r.changes.some((c) => c.kind === 'equipment' && /Back Squat → Bulgarian Split Squat/.test(c.text)));
  // No pull-up bar at home and nothing else trains lats first, so the swap falls back to a row that works them.
  const upper = allSessions(r).find((s) => s.label === 'Upper');
  assert.deepEqual(upper.exercises.map((e) => e.name),
    ['Dumbbell Bench Press', 'One-Arm Dumbbell Row', 'Dumbbell Shoulder Press', 'Chest-Supported Dumbbell Row']);
});

test('limited machines swaps to machine versions', () => {
  const r = adjustWeek({ basePlan: ULF, daysAvailable: 3, activities: [], equipment: 'limited' });
  const lower = allSessions(r).find((s) => s.label === 'Lower');
  assert.deepEqual(lower.exercises.map((e) => e.name), ['Leg Press', 'Stiff-Legged Dumbbell Deadlift', 'Dumbbell Lunge', 'Standing Calf Raise']);
});

test('full gym keeps every planned exercise; no setup repeats or loses an exercise in a session', () => {
  const plan = ['upper', 'lower', 'full', 'push', 'pull', 'legs'].map((type, day) => ({ type, day }));
  const full = adjustWeek({ basePlan: plan, daysAvailable: 6, activities: [], equipment: 'full' });
  assert.ok(!full.changes.some((c) => c.kind === 'equipment'));
  ['full', 'home', 'limited'].forEach((equipment) => {
    allSessions(adjustWeek({ basePlan: plan, daysAvailable: 6, activities: [], equipment })).forEach((s) => {
      assert.equal(s.exercises.length, 4, equipment + ' ' + s.label);
      assert.equal(new Set(s.exercises.map((e) => e.name)).size, 4, equipment + ' ' + s.label);
    });
  });
});

test('never puts two sessions on the same day', () => {
  const plan = [MON, TUE, WED, THU, FRI].map((d, i) => ({ type: i % 2 ? 'lower' : 'upper', day: d }));
  const r = adjustWeek({
    basePlan: plan,
    daysAvailable: 5,
    activities: [{ type: 'soccer', day: TUE }, { type: 'running', day: SAT }],
    equipment: 'full',
  });
  assert.ok(r.week.every((w) => w.sessions.length <= 1));
  assert.equal(allSessions(r).length, 5);
});

test('empty base plan → error message', () => {
  const r = adjustWeek({ basePlan: [], daysAvailable: 3, activities: [], equipment: 'full' });
  assert.ok(r.error);
});

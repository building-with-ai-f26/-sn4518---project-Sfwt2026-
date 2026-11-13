// Deterministic tests for onboarding step 1: profile validation, BMI, and on-device storage.
// Run from the repo root:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProfile, bmi, createStore } = require('../prototype/profile.js');

// A complete, valid metric profile as the form would send it (strings).
const VALID = { units: 'metric', age: '29', heightCm: '180', weightKg: '81', bodyFatPct: '', goal: 'get_stronger' };
const without = (field) => { const o = { ...VALID }; delete o[field]; return o; };

// In-memory stand-in for window.localStorage.
function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), size: () => m.size };
}

// ---- Required fields ----

test('a complete profile is valid', () => {
  const r = validateProfile(VALID);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
  assert.equal(r.profile.age, 29);
  assert.equal(r.profile.heightCm, 180);
  assert.equal(r.profile.weightKg, 81);
  assert.equal(r.profile.bodyFatPct, null);
  assert.equal(r.profile.goal, 'get_stronger');
});

for (const [field, errorKey] of [['age', 'age'], ['heightCm', 'height'], ['weightKg', 'weight'], ['goal', 'goal']]) {
  test(`${field} is required (missing)`, () => {
    const r = validateProfile(without(field));
    assert.equal(r.ok, false);
    assert.ok(r.errors[errorKey], `expected an error on ${errorKey}`);
    assert.equal(r.profile, null);
    assert.deepEqual(Object.keys(r.errors), [errorKey], 'only the missing field is flagged');
  });

  test(`${field} is required (blank or spaces)`, () => {
    for (const blank of ['', '   ', null]) {
      const r = validateProfile({ ...VALID, [field]: blank });
      assert.equal(r.ok, false);
      assert.ok(r.errors[errorKey], `blank ${JSON.stringify(blank)} should be rejected`);
    }
  });
}

test('an empty form flags every required field and nothing optional', () => {
  const r = validateProfile({});
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['age', 'goal', 'height', 'weight']);
});

test('imperial: feet and pounds are required', () => {
  const base = { units: 'imperial', age: '29', heightFt: '5', heightIn: '11', weightLb: '180', goal: 'build_mass' };
  assert.equal(validateProfile(base).ok, true);
  assert.ok(validateProfile({ ...base, heightFt: '' }).errors.height);
  assert.ok(validateProfile({ ...base, weightLb: '' }).errors.weight);
});

test('imperial: inches can be left blank (counts as 0)', () => {
  const r = validateProfile({ units: 'imperial', age: '29', heightFt: '6', heightIn: '', weightLb: '180', goal: 'build_mass' });
  assert.equal(r.ok, true);
  assert.equal(Math.round(r.profile.heightCm * 10) / 10, 182.9);
});

// ---- Field rules ----

test('body fat % is optional, but checked when given', () => {
  assert.equal(validateProfile({ ...VALID, bodyFatPct: '' }).ok, true);
  assert.equal(validateProfile({ ...VALID, bodyFatPct: '18.5' }).profile.bodyFatPct, 18.5);
  assert.ok(validateProfile({ ...VALID, bodyFatPct: '85' }).errors.bodyFatPct);
  assert.ok(validateProfile({ ...VALID, bodyFatPct: 'abc' }).errors.bodyFatPct);
});

test('goal must be exactly one of the four options', () => {
  for (const g of ['lose_fat', 'get_stronger', 'stay_healthy', 'build_mass']) {
    assert.equal(validateProfile({ ...VALID, goal: g }).ok, true, g);
  }
  assert.ok(validateProfile({ ...VALID, goal: 'get_shredded' }).errors.goal);
});

test('out-of-range and non-numeric values are rejected', () => {
  assert.ok(validateProfile({ ...VALID, age: '8' }).errors.age);
  assert.ok(validateProfile({ ...VALID, age: '29.5' }).errors.age);
  assert.ok(validateProfile({ ...VALID, age: 'abc' }).errors.age);
  assert.ok(validateProfile({ ...VALID, heightCm: '18' }).errors.height, 'metres typed instead of cm');
  assert.ok(validateProfile({ ...VALID, weightKg: '0' }).errors.weight);
  assert.ok(validateProfile({ ...VALID, weightKg: 'abc' }).errors.weight);
  assert.ok(validateProfile({ units: 'imperial', age: '29', heightFt: '5', heightIn: '14', weightLb: '180', goal: 'lose_fat' }).errors.height);
});

// ---- BMI ----

test('BMI is calculated from height and weight', () => {
  assert.equal(bmi(180, 81), 25);
  assert.equal(bmi(165, 60), 22);
  assert.equal(bmi(0, 60), null);
  assert.equal(bmi(null, 60), null);
});

test('BMI is the same in imperial and metric', () => {
  const r = validateProfile({ units: 'imperial', age: '29', heightFt: '5', heightIn: '11', weightLb: '180', goal: 'lose_fat' });
  assert.equal(bmi(r.profile.heightCm, r.profile.weightKg), 25.1); // 5'11", 180 lb
});

test('measured height/weight are available before the rest of the form is filled', () => {
  const r = validateProfile({ units: 'metric', heightCm: '180', weightKg: '81' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.measured, { heightCm: 180, weightKg: 81 });
});

// ---- Storage on this device ----

test('profiles are stored separately and saving one does not touch another', () => {
  const s = fakeStorage();
  const store = createStore(s);
  const a = store.saveProfile({ ...validateProfile(VALID).profile, nickname: 'Ana' });
  const b = store.saveProfile({ ...validateProfile({ ...VALID, age: '35' }).profile, nickname: 'Ben' });
  assert.notEqual(a.id, b.id);

  store.saveProfile({ ...store.loadProfile(a.id).profile, age: 30 }, a.id); // edit Ana
  assert.equal(store.loadProfile(a.id).profile.age, 30);
  assert.equal(store.loadProfile(b.id).profile.age, 35, "Ben's profile is unchanged");
  assert.deepEqual(store.listProfiles().map((p) => p.nickname), ['Ana', 'Ben']);
  assert.equal(store.loadProfile(a.id).createdAt, a.createdAt, 'editing keeps the creation date');
});

test('a profile without a name gets a default one', () => {
  const store = createStore(fakeStorage());
  const rec = store.saveProfile(validateProfile(VALID).profile);
  assert.equal(rec.profile.nickname, 'Profile 1');
});

test('current profile is remembered; unknown or corrupt data is ignored', () => {
  const s = fakeStorage();
  const store = createStore(s);
  assert.equal(store.getCurrentId(), null);
  const rec = store.saveProfile(validateProfile(VALID).profile);
  store.setCurrentId(rec.id);
  assert.equal(createStore(s).getCurrentId(), rec.id, 'survives a page reload');

  s.setItem('flexweek:current', 'does-not-exist');
  assert.equal(store.getCurrentId(), null);
  s.setItem('flexweek:profiles', '{not json');
  assert.deepEqual(store.listProfiles(), []);
});

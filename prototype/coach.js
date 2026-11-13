/*
 * FlexWeek prototype — the rules engine.
 *
 * Takes a base weekly plan plus this week's constraints and returns an
 * adjusted week with a one-line reason for every change.
 * Fixed rules only: no AI calls, no network, no API keys.
 *
 * Works in the browser (window.FlexWeek) and in Node (require) for tests.
 *
 * Rules, applied in order:
 *   1. Fit to days   — fewer days than sessions? merge sessions (keep upper/lower balance), or drop a covered one.
 *   2. Schedule      — place sessions on days, avoiding sport days, the day before a sport that
 *                      loads the same muscles, the day after it, and back-to-back same-muscle sessions.
 *   3. Volume        — if a sport loads a muscle group this week, cut that group's lifts from 3 to 2 sets.
 *   4. Equipment     — swap any exercise the user's equipment can't do for an alternative
 *                      from the exercise catalog (exercises.js) that it can.
 */
(function (root) {
  'use strict';

  // The exercise catalog: exercises.js must be loaded before this file in the browser.
  const CATALOG = typeof module !== 'undefined' && module.exports ? require('./exercises.js') : root.FlexWeekCatalog;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Session types and the muscle groups each one trains.
  const SESSION_TYPES = {
    upper: { name: 'Upper', groups: ['upper'] },
    lower: { name: 'Lower', groups: ['lower'] },
    full: { name: 'Full Body', groups: ['upper', 'lower'] },
    push: { name: 'Push', groups: ['upper'] },
    pull: { name: 'Pull', groups: ['upper'] },
    legs: { name: 'Legs', groups: ['lower'] },
  };

  // Other activities and the muscle group they load (null = light, no conflict).
  const ACTIVITIES = {
    soccer: { name: 'Soccer', load: 'lower' },
    running: { name: 'Running', load: 'lower' },
    basketball: { name: 'Basketball', load: 'lower' },
    tennis: { name: 'Tennis', load: 'lower' },
    cycling: { name: 'Cycling', load: 'lower' },
    hiking: { name: 'Hiking', load: 'lower' },
    swimming: { name: 'Swimming', load: 'upper' },
    climbing: { name: 'Climbing', load: 'upper' },
    yoga: { name: 'Yoga / mobility', load: null },
  };

  const EQUIPMENT = {
    full: 'Full gym',
    home: 'Home (dumbbells, bench, bands, bodyweight)',
    limited: 'Limited machines (machines, cables, light dumbbells; no barbell rack)',
  };
  const EQUIPMENT_SHORT = { full: 'Full gym', home: 'Home setup', limited: 'Limited machines' };

  // The physical equipment each setup has, using the catalog's equipment names.
  const NOT_IN_LIMITED = ['barbell', 'rack', 'trap bar', 'ez curl bar', 'kettlebell'];
  const AVAILABLE = {
    full: CATALOG.EQUIPMENT_ITEMS,
    home: ['dumbbells', 'adjustable bench', 'resistance band'],
    limited: CATALOG.EQUIPMENT_ITEMS.filter((item) => !NOT_IN_LIMITED.includes(item)),
  };

  // Look up a catalog exercise by its display name (fails loudly on a typo).
  function ex(name) {
    const e = CATALOG.EXERCISES.find((x) => x.name === name);
    if (!e) throw new Error('Exercise not in catalog: ' + name);
    return e;
  }

  // The full-gym exercises for each session type. Other setups swap these by rule (see applyEquipment).
  const SESSION_EXERCISES = {
    upper: ['Barbell Bench Press', 'Bent Over Barbell Row', 'Overhead Press', 'Pull-Up'],
    lower: ['Back Squat', 'Romanian Deadlift', 'Dumbbell Lunge', 'Standing Calf Raise'],
    full: ['Back Squat', 'Barbell Bench Press', 'Bent Over Barbell Row', 'Romanian Deadlift'],
    push: ['Barbell Bench Press', 'Overhead Press', 'Triceps Dip', 'Triceps Pushdown'],
    pull: ['Pull-Up', 'Bent Over Barbell Row', 'Face Pull', 'Barbell Curl'],
    legs: ['Back Squat', 'Romanian Deadlift', 'Dumbbell Lunge', 'Standing Calf Raise'],
  };
  Object.keys(SESSION_EXERCISES).forEach((type) => { SESSION_EXERCISES[type] = SESSION_EXERCISES[type].map(ex); });

  // Which of the coach's two muscle groups an exercise counts toward.
  const LOWER_MUSCLES = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'];
  const groupOf = (e) => (LOWER_MUSCLES.includes(e.primaryMuscles[0]) ? 'lower' : 'upper');

  const BASE_SETS = 3;
  const REDUCED_SETS = 2;

  // Scheduling costs (lower total = better week).
  const COST = {
    sameDayActivity: 10, // lifting on a sport day
    dayBeforeLoad: 8, // e.g. legs the day before soccer
    dayAfterLoad: 4, // e.g. legs the day after soccer
    backToBack: 3, // same muscles on consecutive days
    perDayMoved: 1, // prefer staying close to the base plan
  };

  const GROUP_WORD = { lower: 'legs', upper: 'upper body' };

  // ---------- helpers ----------
  const groupsOf = (s) => SESSION_TYPES[s.type].groups;
  const sharesGroup = (a, b) => groupsOf(a).some((g) => groupsOf(b).includes(g));
  const dayName = (d) => (d == null ? 'no set day' : DAYS[d]);
  const actName = (a) => ACTIVITIES[a.type].name;
  const minDay = (a, b) => (a == null ? b : b == null ? a : Math.min(a, b));
  const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

  function label(s) {
    const name = SESSION_TYPES[s.type].name;
    return s.origins.length > 1 ? name + ' (' + s.origins.join(' + ') + ')' : name;
  }

  function onlyGroup(list, g) {
    const idx = [];
    list.forEach((s, i) => {
      const gs = groupsOf(s);
      if (gs.length === 1 && gs[0] === g) idx.push(i);
    });
    return idx;
  }

  // ---------- Rule 1: fit the plan into the available days ----------
  function fitToDays(sessions, n, changes) {
    let list = sessions.slice();
    if (n === 0) {
      changes.push({
        kind: 'drop',
        text: 'No training days this week, so all ' + plural(list.length, 'session') + ' are skipped. Your other activities still count.',
      });
      return [];
    }
    while (list.length > n) {
      const hits = (g) => list.filter((s) => groupsOf(s).includes(g)).length;
      const ups = onlyGroup(list, 'upper');
      const lows = onlyGroup(list, 'lower');
      const up = hits('upper');
      const low = hits('lower');

      // Pick which two sessions to merge so upper/lower stay balanced.
      let pair = null;
      let type = null;
      if (ups.length >= 2 && up > low) { pair = [ups[0], ups[1]]; type = 'upper'; }
      else if (lows.length >= 2 && low > up) { pair = [lows[0], lows[1]]; type = 'lower'; }
      else if (ups.length && lows.length) { pair = [ups[0], lows[0]]; type = 'full'; }
      else if (ups.length >= 2) { pair = [ups[0], ups[1]]; type = 'upper'; }
      else if (lows.length >= 2) { pair = [lows[0], lows[1]]; type = 'lower'; }

      if (pair) {
        const a = list[pair[0]];
        const b = list[pair[1]];
        const merged = {
          type,
          baseDay: minDay(a.baseDay, b.baseDay),
          origins: a.origins.concat(b.origins),
          changes: [],
        };
        const keeps = type === 'full' ? 'upper and lower body both still get trained' : 'all its exercises still get done';
        changes.push({
          kind: 'merge',
          text: 'Merged ' + label(a) + ' (' + dayName(a.baseDay) + ') + ' + label(b) + ' (' + dayName(b.baseDay) +
            ') into one ' + SESSION_TYPES[type].name + ' session: only ' + plural(n, 'training day') + ', and ' + keeps + '.',
        });
        const lo = Math.min(pair[0], pair[1]);
        const hi = Math.max(pair[0], pair[1]);
        const out = [];
        list.forEach((s, i) => {
          if (i === lo) out.push(merged);
          else if (i !== hi) out.push(s);
        });
        list = out;
        continue;
      }

      // Nothing sensible to merge (e.g. all Full Body): drop one whose muscles are covered elsewhere.
      let idx = list.length - 1;
      for (let i = list.length - 1; i >= 0; i--) {
        const others = list.filter((_, j) => j !== i);
        if (groupsOf(list[i]).every((g) => others.some((o) => groupsOf(o).includes(g)))) { idx = i; break; }
      }
      const d = list[idx];
      changes.push({
        kind: 'drop',
        text: 'Dropped ' + label(d) + ' (' + dayName(d.baseDay) + '): only ' + plural(n, 'training day') +
          ', and the remaining sessions still cover the same muscles.',
      });
      list = list.filter((_, j) => j !== idx);
    }
    return list;
  }

  // ---------- Rule 2: place sessions on days ----------
  function activityIssues(s, day, actsByDay) {
    const issues = [];
    let cost = 0;
    const loads = (a) => {
      const g = ACTIVITIES[a.type].load;
      return g && groupsOf(s).includes(g);
    };
    const describe = (acts) => acts.map(actName).join(' + ');

    const same = actsByDay[day];
    if (same.length) {
      cost += COST.sameDayActivity;
      issues.push(describe(same) + ' is the same day');
    }
    const next = day < 6 ? actsByDay[day + 1].filter(loads) : [];
    if (next.length) {
      cost += COST.dayBeforeLoad;
      issues.push(describe(next) + ' on ' + DAYS[day + 1] + ' needs fresh ' + GROUP_WORD[ACTIVITIES[next[0].type].load]);
    }
    const prev = day > 0 ? actsByDay[day - 1].filter(loads) : [];
    if (prev.length) {
      cost += COST.dayAfterLoad;
      issues.push("you'll still be recovering from " + describe(prev) + ' on ' + DAYS[day - 1]);
    }
    return { cost, issues };
  }

  // Try every way to put the sessions on distinct days (at most 7! = 5040) and keep the cheapest.
  function bestDays(list, actsByDay) {
    const n = list.length;
    const fixed = list.map((s) =>
      DAYS.map((_, d) => activityIssues(s, d, actsByDay).cost + (s.baseDay == null ? 0 : COST.perDayMoved * Math.abs(d - s.baseDay)))
    );
    const days = new Array(n);
    const used = new Array(7).fill(false);
    let best = null;
    let bestCost = Infinity;

    (function place(i, cost) {
      if (cost >= bestCost) return;
      if (i === n) { bestCost = cost; best = days.slice(); return; }
      for (let d = 0; d < 7; d++) {
        if (used[d]) continue;
        let c = fixed[i][d];
        for (let j = 0; j < i; j++) {
          if (Math.abs(days[j] - d) === 1 && sharesGroup(list[i], list[j])) c += COST.backToBack;
        }
        used[d] = true;
        days[i] = d;
        place(i + 1, cost + c);
        used[d] = false;
      }
    })(0, 0);
    return best;
  }

  function schedule(list, actsByDay) {
    const days = bestDays(list, actsByDay);
    list.forEach((s, i) => { s.day = days[i]; });

    list.forEach((s) => {
      if (s.baseDay != null && s.day !== s.baseDay) {
        const base = activityIssues(s, s.baseDay, actsByDay);
        let why;
        if (base.issues.length) {
          why = base.issues.join('; ');
        } else {
          const taker = list.find((o) => o !== s && o.day === s.baseDay);
          const neighbor = list.find((o) => o !== s && Math.abs(o.day - s.baseDay) === 1 && sharesGroup(s, o));
          if (taker) why = label(taker) + ' now sits on ' + DAYS[s.baseDay];
          else if (neighbor) why = 'on ' + DAYS[s.baseDay] + ' it would be back-to-back with ' + label(neighbor) + ' (' + DAYS[neighbor.day] + ') on the same muscles';
          else why = 'keeps rest days between sessions after the other changes';
        }
        s.changes.push({ kind: 'move', text: 'Moved ' + label(s) + ' ' + DAYS[s.baseDay] + ' → ' + DAYS[s.day] + ': ' + why + '.' });
      }
      const now = activityIssues(s, s.day, actsByDay);
      if (now.issues.length) {
        s.changes.push({
          kind: 'warning',
          text: 'Heads-up: ' + label(s) + ' on ' + DAYS[s.day] + ' — ' + now.issues.join('; ') + '. No better day this week, so keep it light.',
        });
      }
    });

    // Back-to-back sessions on the same muscles that could not be avoided.
    const sorted = list.slice().sort((a, b) => a.day - b.day);
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1];
      const b = sorted[i];
      if (b.day - a.day === 1 && sharesGroup(a, b)) {
        b.changes.push({
          kind: 'warning',
          text: 'Heads-up: ' + label(a) + ' (' + DAYS[a.day] + ') and ' + label(b) + ' (' + DAYS[b.day] +
            ') hit the same muscles on back-to-back days — not enough free days to space them out.',
        });
      }
    }
  }

  // ---------- Rule 3: trim volume for muscles a sport already loads ----------
  function adjustVolume(list, activities) {
    list.forEach((s) => {
      s.reduced = [];
      groupsOf(s).forEach((g) => {
        const hits = activities.filter((a) => ACTIVITIES[a.type].load === g);
        if (!hits.length) return;
        s.reduced.push(g);
        const who = hits.map((a) => actName(a) + ' (' + DAYS[a.day] + ')').join(', ');
        s.changes.push({
          kind: 'volume',
          text: 'Cut ' + (g === 'lower' ? 'leg' : 'upper-body') + ' lifts in ' + label(s) + ' to ' + REDUCED_SETS + ' sets: ' +
            who + ' already load' + (hits.length === 1 ? 's' : '') + ' your ' + GROUP_WORD[g] + ' this week.',
        });
      });
    });
  }

  // ---------- Rule 4: swap exercises for the available equipment ----------
  // Finds a replacement the user can do, trying the closest match first:
  //   1. a catalog alternative (same primary muscle, same push/pull, same compound/isolation)
  //   2. same primary muscle and same push/pull
  //   3. same push/pull, with the muscle worked as a secondary muscle
  // Within each step, weighted exercises beat bodyweight ones, and nothing already in the session is repeated.
  function findSwap(e, available, usedIds) {
    const muscle = e.primaryMuscles[0];
    const doable = CATALOG.EXERCISES.filter((x) =>
      x.category === 'strength' && x.force === e.force && !usedIds.includes(x.id) && CATALOG.canDo(x, available));
    const steps = [
      CATALOG.alternatives(e.id, available).filter((x) => !usedIds.includes(x.id)),
      doable.filter((x) => x.primaryMuscles[0] === muscle),
      doable.filter((x) => x.secondaryMuscles.includes(muscle)),
    ];
    for (const options of steps) {
      const pick = options.find((x) => x.equipment.length) || options[0];
      if (pick) return pick;
    }
    return null;
  }

  function applyEquipment(list, equipment) {
    const available = AVAILABLE[equipment];
    list.forEach((s) => {
      const planned = SESSION_EXERCISES[s.type];
      const usedIds = planned.filter((e) => CATALOG.canDo(e, available)).map((e) => e.id);
      const swaps = [];
      const dropped = [];
      s.exercises = [];
      planned.forEach((e) => {
        let chosen = e;
        if (!CATALOG.canDo(e, available)) {
          chosen = findSwap(e, available, usedIds);
          if (!chosen) return dropped.push(e.name);
          usedIds.push(chosen.id);
          swaps.push(e.name + ' → ' + chosen.name);
        }
        const group = groupOf(e);
        s.exercises.push({ id: chosen.id, name: chosen.name, group, sets: s.reduced.includes(group) ? REDUCED_SETS : BASE_SETS });
      });
      if (swaps.length) {
        s.changes.push({ kind: 'equipment', text: EQUIPMENT_SHORT[equipment] + ' swaps in ' + label(s) + ': ' + swaps.join(', ') + '.' });
      }
      if (dropped.length) {
        s.changes.push({ kind: 'equipment', text: 'Left out of ' + label(s) + ': ' + dropped.join(', ') + ' (nothing in the catalog replaces it with this equipment).' });
      }
    });
  }

  // ---------- main entry point ----------
  /**
   * input = {
   *   basePlan: [{ type: 'upper', day: 0 }, ...]   // day: 0=Mon … 6=Sun, or null
   *   daysAvailable: 3,
   *   activities: [{ type: 'soccer', day: 3 }, ...],
   *   equipment: 'full' | 'home' | 'limited',
   * }
   */
  function adjustWeek(input) {
    const equipment = AVAILABLE[input.equipment] ? input.equipment : 'full';
    const toDay = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
    const daysAvailable = Math.max(0, Math.min(7, Math.floor(Number(input.daysAvailable) || 0)));
    const activities = (input.activities || [])
      .map((a) => ({ type: a.type, day: toDay(a.day) }))
      .filter((a) => ACTIVITIES[a.type] && a.day !== null && a.day >= 0 && a.day <= 6);
    const base = (input.basePlan || [])
      .filter((s) => SESSION_TYPES[s.type])
      .map((s) => {
        const d = toDay(s.day);
        return { type: s.type, baseDay: d !== null && d >= 0 && d <= 6 ? d : null, origins: [SESSION_TYPES[s.type].name], changes: [] };
      });

    if (!base.length) return { error: 'Add at least one session to your base plan.' };
    if (base.length > 7) return { error: 'A base plan can have at most 7 sessions (one per day).' };

    const planChanges = [];
    const notes = [];
    const list = fitToDays(base, daysAvailable, planChanges);

    if (daysAvailable > base.length) {
      notes.push('You have ' + plural(daysAvailable, 'day') + ' but your plan only needs ' + base.length +
        '. Extra days stay as rest; add sessions to your base plan to use them.');
    }

    const actsByDay = DAYS.map((_, d) => activities.filter((a) => a.day === d));
    if (list.length) {
      schedule(list, actsByDay);
      adjustVolume(list, activities);
      applyEquipment(list, equipment);
    }

    const order = { move: 0, volume: 1, equipment: 2, warning: 3 };
    const sessionChanges = list
      .slice()
      .sort((a, b) => a.day - b.day)
      .flatMap((s) => s.changes.slice().sort((x, y) => order[x.kind] - order[y.kind]));
    const changes = planChanges.concat(sessionChanges);

    if (!changes.length) notes.push('Your base plan already fits this week. No changes needed.');

    const week = DAYS.map((name, d) => ({
      day: name,
      sessions: list
        .filter((s) => s.day === d)
        .map((s) => ({ type: s.type, label: label(s), groups: groupsOf(s).slice(), exercises: s.exercises })),
      activities: actsByDay[d].map(actName),
    }));

    return { week, changes, notes, equipment: EQUIPMENT[equipment] };
  }

  const api = { adjustWeek, DAYS, SESSION_TYPES, ACTIVITIES, EQUIPMENT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexWeek = api;
})(this);

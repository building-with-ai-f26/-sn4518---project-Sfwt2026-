/*
 * Small helper for looking inside data/exercises.json (free-exercise-db, public domain)
 * without printing the whole 1 MB file.
 *
 * Usage (run from the repo root):
 *   node scripts/exercise-db.js stats                 field names and value counts
 *   node scripts/exercise-db.js find <text>           names containing <text>
 *   node scripts/exercise-db.js list <field> <value>  names where field = value (e.g. list category stretching)
 *   node scripts/exercise-db.js names <category>      names only, grouped by muscle (e.g. names stretching)
 *   node scripts/exercise-db.js show <exact name>     one exercise in full, instructions included
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'exercises.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const [cmd, a, b] = process.argv.slice(2);

function line(e) {
  return [e.name, e.equipment, e.category, e.force, e.mechanic, (e.primaryMuscles || []).join('+')].join(' | ');
}

function countBy(field) {
  const counts = {};
  db.forEach((e) => {
    const v = Array.isArray(e[field]) ? e[field] : [e[field]];
    v.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });
  });
  return Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([k, n]) => k + ' ' + n).join(', ');
}

if (cmd === 'stats') {
  console.log('exercises:', db.length);
  console.log('fields:', Object.keys(db[0]).join(', '));
  ['category', 'equipment', 'force', 'mechanic', 'level', 'primaryMuscles'].forEach((f) => {
    console.log('\n' + f + ': ' + countBy(f));
  });
} else if (cmd === 'find') {
  const q = a.toLowerCase();
  db.filter((e) => e.name.toLowerCase().includes(q)).forEach((e) => console.log(line(e)));
} else if (cmd === 'list') {
  db.filter((e) => (Array.isArray(e[a]) ? e[a].includes(b) : String(e[a]) === b)).forEach((e) => console.log(line(e)));
} else if (cmd === 'names') {
  // Compact: names only, grouped by primary muscle, for one category (e.g. names strength).
  const groups = {};
  db.filter((e) => e.category === a).forEach((e) => {
    const m = (e.primaryMuscles || ['none'])[0];
    (groups[m] = groups[m] || []).push(e.name + ' [' + e.equipment + ']');
  });
  Object.keys(groups).sort().forEach((m) => console.log('\n## ' + m + ' (' + groups[m].length + ')\n' + groups[m].join('; ')));
} else if (cmd === 'show') {
  // Print one exercise in full (instructions included), by exact name.
  const e = db.find((x) => x.name.toLowerCase() === process.argv.slice(3).join(' ').toLowerCase());
  console.log(e ? JSON.stringify(e, null, 1) : 'not found');
} else {
  console.log('Commands: stats | find <text> | list <field> <value> | names <category> | show <exact name>');
}

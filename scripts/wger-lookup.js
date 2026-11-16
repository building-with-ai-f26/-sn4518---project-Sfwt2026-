/*
 * Small helper for checking scripts/wger-matches.txt against wger (https://wger.de), the free
 * exercise database the app fetches descriptions from. It downloads wger's English exercise list
 * (one request, no API key) and searches it. Needs Node 18+ and an internet connection.
 *
 * Usage (run from the repo root):
 *   node scripts/wger-lookup.js find <text>      wger exercises whose name contains <text>
 *   node scripts/wger-lookup.js show <wger id>   one wger exercise's full description, as the app shows it
 */
'use strict';
const path = require('path');
const { htmlToText } = require(path.join(__dirname, '..', 'prototype', 'wger.js'));

const ENGLISH_LIST = 'https://wger.de/api/v2/exercise-translation/?format=json&language=2&limit=2000';
const [cmd, ...rest] = process.argv.slice(2);
const query = rest.join(' ').trim();

async function main() {
  if (!['find', 'show'].includes(cmd) || !query) {
    console.log('Commands: find <text> | show <wger id>');
    return;
  }
  const response = await fetch(ENGLISH_LIST);
  if (!response.ok) throw new Error('wger answered ' + response.status);
  const exercises = (await response.json()).results; // each: { exercise: <wger id>, name, description (HTML), ... }

  if (cmd === 'find') {
    const hits = exercises.filter((x) => x.name.toLowerCase().includes(query.toLowerCase()));
    hits.sort((a, b) => a.name.localeCompare(b.name)).forEach((x) => {
      const text = htmlToText(x.description).replace(/\s+/g, ' ');
      console.log(String(x.exercise).padStart(5) + ' | ' + x.name + ' | ' + text.length + ' chars | ' + text.slice(0, 90));
    });
    console.log(hits.length + ' of ' + exercises.length + ' wger exercises match "' + query + '"');
  } else {
    const x = exercises.find((e) => String(e.exercise) === query);
    console.log(x ? 'wger ' + x.exercise + ': ' + x.name + '\n\n' + (htmlToText(x.description) || '(empty description)') : 'No English wger exercise with id ' + query);
  }
}

main().catch((error) => {
  console.error('Could not reach wger: ' + error.message);
  process.exit(1);
});

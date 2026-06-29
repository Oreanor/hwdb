#!/usr/bin/env node
/*
 * crystallize-series.js
 * ---------------------
 * Conservative, "definitely-safe" normalization of variant series (`Sr`):
 * strips card numbers (5/10, (5/10), #16), Mix codes, empty parens and stray
 * edge punctuation. Does NOT touch years, scale, or merge sub-series — those
 * are left for manual cleanup in the /series tool.
 *
 * Writes data/hw.json in place (backup to scripts/output/).
 *
 * Usage: node scripts/crystallize-series.js
 */

const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'hw.json');
const BACKUP = path.join('scripts', 'output', 'carsdata.pre-crystallize.json');

function safeCrystallize(s) {
  let t = s;
  t = t.replace(/\(?\d+\s*\/\s*\d+\)?/g, ' '); // card number 5/10, (5/10), even glued (Buccaneers1/5)
  t = t.replace(/#\s*\d+/g, ' '); // #16
  t = t.replace(/\(\s*mix[^)]*\)/gi, ' '); // (Mix K)
  t = t.replace(/\(\s*\)/g, ' '); // empty ()
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/^[/:\-–&,\s]+|[/:\-–&,\s]+$/g, '').trim(); // edge punctuation
  return t.replace(/\s+/g, ' ').trim();
}

function distinct(db) {
  const set = new Set();
  for (const c of db) for (const v of c.d ?? []) if (v.Sr) set.add(v.Sr);
  return set.size;
}

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const before = distinct(db);

let changed = 0;
let cleared = 0;
for (const c of db) {
  for (const v of c.d ?? []) {
    if (!v.Sr) continue;
    const t = safeCrystallize(v.Sr);
    if (t === v.Sr) continue;
    changed++;
    if (t) v.Sr = t;
    else {
      delete v.Sr;
      cleared++;
    }
  }
}

fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
fs.copyFileSync(DB, BACKUP);
fs.writeFileSync(DB, JSON.stringify(db, null, 2));

console.log(`distinct series: ${before} -> ${distinct(db)}`);
console.log(`variants changed: ${changed} (${cleared} became empty)`);
console.log(`backup -> ${BACKUP}`);

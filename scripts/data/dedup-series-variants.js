#!/usr/bin/env node
/*
 * dedup-series-variants.js
 * ------------------------
 * Standardizes variant series (`Sr`) and merges the duplicates that result.
 *
 * Background: the 2025/26 sync added records whose `Sr` carried the model's
 * position number inside the series name ("HW Fan Driven / 2/5", "Hot Wheels
 * Boulevard / #141"). `crystallize-series.js` was never re-run, so each of
 * these duplicated the already-clean record. Worse, fields split across the
 * pair: the clean record kept `m:1`, the suffixed one kept `_img`.
 *
 * This script:
 *   1. Crystallizes `Sr` on every variant (same rules as crystallize-series.js).
 *   2. Within each casting, groups variants by (clean Sr + full spec).
 *   3. For each group >1 with no image conflict AND whose members had DIFFERENT
 *      raw `Sr` (i.e. the suffix was the only thing keeping them apart), merges
 *      into the lowest-id record (union of non-empty fields; preserves m:1 and
 *      _img).
 *   4. Groups whose members already shared the same raw `Sr` are left intact:
 *      those are distinct variants whose distinguishing detail simply isn't
 *      captured in our spec fields (different shade, etc.) — NOT duplicates.
 *   5. Groups whose members carry DIFFERENT _img are also left intact.
 *
 * Writes data/carsdata.json in place (backup to scripts/output/).
 *
 * Usage:
 *   node scripts/data/dedup-series-variants.js            # dry run (no write)
 *   node scripts/data/dedup-series-variants.js --apply    # write changes
 */

const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'carsdata.json');
const BACKUP = path.join('scripts', 'output', 'carsdata.pre-dedup-variants.json');
const APPLY = process.argv.includes('--apply');

// Same normalization as crystallize-series.js: strip card numbers (5/10,
// (5/10), #16), Mix codes, empty parens and stray edge punctuation.
function safeCrystallize(s) {
  let t = s || '';
  t = t.replace(/\(?\d+\s*\/\s*\d+\)?/g, ' ');
  t = t.replace(/#\s*\d+/g, ' ');
  t = t.replace(/\(\s*mix[^)]*\)/gi, ' ');
  t = t.replace(/\(\s*\)/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/^[/:\-–&,\s]+|[/:\-–&,\s]+$/g, '').trim();
  return t.replace(/\s+/g, ' ').trim();
}

// Fields that define the same physical release (Sr handled separately; id /
// _img / m / p / N are identity/metadata, not spec).
const SPEC = ['y', 'c', 'In', 'Wh', 'Tn', 'Wn', 'Bs', 'Tm', 'Cn', 'Nt'];
const norm = (s) => (s == null ? '' : String(s).trim());
const idNum = (r) => {
  const n = parseInt(r.id, 10);
  return Number.isNaN(n) ? Infinity : n;
};

// Merge `extra` into `keep`: fill empty fields, OR-in m:1, carry _img.
function mergeInto(keep, extra) {
  for (const k of Object.keys(extra)) {
    if (k === 'id') continue;
    if (k === 'm') {
      if (extra.m === 1) keep.m = 1;
      continue;
    }
    if (keep[k] === undefined || norm(keep[k]) === '') keep[k] = extra[k];
  }
}

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

const distinctSeries = () => {
  const set = new Set();
  for (const c of db) for (const v of c.d ?? []) if (v.Sr) set.add(v.Sr);
  return set.size;
};
const seriesBefore = distinctSeries();

let srChanged = 0;
let groupsMerged = 0;
let recsRemoved = 0;
let conflictGroups = 0;
const examples = [];

for (const car of db) {
  const rels = car.d ?? [];

  // Snapshot raw Sr before crystallizing — used to tell suffix-duplicates
  // (raw Sr differed) from genuine same-series variants (raw Sr identical).
  const rawSr = new Map();
  for (const r of rels) rawSr.set(r, norm(r.Sr));

  // 1) crystallize Sr (record changes, don't write yet)
  for (const r of rels) {
    if (!r.Sr) continue;
    const t = safeCrystallize(r.Sr);
    if (t === r.Sr) continue;
    srChanged++;
    if (t) r.Sr = t;
    else delete r.Sr;
  }

  // 2) group by clean Sr + spec
  const groups = new Map();
  for (const r of rels) {
    const key = norm(r.Sr) + '||' + SPEC.map((k) => norm(r[k])).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  // 3) decide which records to drop
  const drop = new Set();
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    // Only merge when the suffix was the sole difference: members must have
    // had >1 distinct raw Sr. Same raw Sr -> genuine distinct variants, skip.
    const rawDistinct = new Set(g.map((r) => rawSr.get(r)));
    if (rawDistinct.size < 2) continue;
    const imgs = [...new Set(g.map((r) => r._img).filter(Boolean))];
    if (imgs.length > 1) {
      conflictGroups++; // distinct variants sharing a spec — keep both
      continue;
    }
    groupsMerged++;
    const sorted = [...g].sort((a, b) => idNum(a) - idNum(b));
    const keep = sorted[0];
    for (const extra of sorted.slice(1)) {
      mergeInto(keep, extra);
      drop.add(extra);
      recsRemoved++;
    }
    if (examples.length < 8) {
      examples.push({
        lnk: car.lnk,
        Sr: keep.Sr,
        keptId: keep.id,
        droppedIds: sorted.slice(1).map((r) => r.id),
        m: keep.m ?? null,
        _img: keep._img ?? null,
      });
    }
  }

  if (drop.size) car.d = rels.filter((r) => !drop.has(r));
}

console.log(`Sr crystallized:       ${srChanged} variants`);
console.log(`distinct series:       ${seriesBefore} -> ${distinctSeries()}`);
console.log(`dup groups merged:     ${groupsMerged}`);
console.log(`records removed:       ${recsRemoved}`);
console.log(`img-conflict groups kept intact: ${conflictGroups}`);
console.log('\nexamples:');
for (const e of examples) console.log('  ', JSON.stringify(e));

if (!APPLY) {
  console.log('\n[dry run] nothing written. Re-run with --apply to write.');
  process.exit(0);
}

fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
fs.copyFileSync(DB, BACKUP);
fs.writeFileSync(DB, JSON.stringify(db, null, 2));
console.log(`\n[applied] backup -> ${BACKUP}`);
console.log(`[applied] wrote  -> ${DB}`);

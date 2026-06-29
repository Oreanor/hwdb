#!/usr/bin/env node
/*
 * merge-into-db.js
 * ----------------
 * Merges the parsed wiki data into data/hw.json:
 *   - new_castings_data.json       -> appended as new car records
 *   - existing_year_additions.json -> appended to the matching existing record
 *
 * Assigns fresh sequential ids (continuing the existing 5-digit zero-padded
 * scheme). New variants get no image flag (`p`) — there are no images for them
 * yet. A pre-merge snapshot is written for safety.
 *
 * Usage: node scripts/merge-into-db.js
 */

const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'hw.json');
const NEW = path.join('scripts', 'output', 'new_castings_data.json');
const ADDS = path.join('scripts', 'output', 'existing_year_additions.json');
const SNAPSHOT = path.join('scripts', 'output', 'carsdata.pre-merge.json');
// What this merge added — consumed by the rescan steps (tags / images / mainline)
// so they only reprocess the delta instead of the whole base.
const MANIFEST = path.join('scripts', 'output', 'sync-manifest.json');

const pad = (n) => String(n).padStart(5, '0');
const read = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []);
const countVariants = (db) => db.reduce((s, c) => s + (c.d ? c.d.length : 0), 0);

function main() {
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const newCastings = read(NEW);
  const adds = read(ADDS);

  // Continue the id sequence after the current maximum.
  let maxId = 0;
  for (const c of db) for (const v of c.d || []) {
    const n = Number(v.id);
    if (!Number.isNaN(n) && n > maxId) maxId = n;
  }
  let next = maxId + 1;
  const newId = () => pad(next++);

  const byLnk = new Map(db.map((c) => [c.lnk, c]));
  const beforeRecords = db.length;
  const beforeVariants = countVariants(db);

  // 1) New castings -> new records.
  const addedCastings = []; // new castings (need tags + images + mainline)
  const toppedCastings = []; // existing castings with new variants (need images + mainline)
  let addedRecords = 0, addedVariants = 0, skippedExisting = 0;
  for (const c of newCastings) {
    if (byLnk.has(c.lnk)) { skippedExisting++; continue; }
    const d = c.d.map((v) => ({ ...v, id: newId() }));
    const rec = {
      lnk: c.lnk,
      ...(c.ds ? { ds: c.ds } : {}),
      ...(c.num ? { num: c.num } : {}),
      ...(c.dsc ? { dsc: c.dsc } : {}),
      d,
    };
    db.push(rec);
    byLnk.set(c.lnk, rec);
    addedRecords++;
    addedVariants += d.length;
    addedCastings.push(c.lnk);
  }

  // 2) Year-adds -> appended to existing records.
  let toppedUp = 0, toppedVariants = 0, addMisses = 0;
  for (const a of adds) {
    const rec = byLnk.get(a.lnk);
    if (!rec) { addMisses++; continue; }
    const d = a.d.map((v) => ({ ...v, id: newId() }));
    rec.d.push(...d);
    toppedUp++;
    toppedVariants += d.length;
    toppedCastings.push(a.lnk);
  }

  // Snapshot (git-ignored) then write.
  fs.copyFileSync(DB, SNAPSHOT);
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));

  // Record the delta for incremental rescans.
  fs.writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        ts: new Date().toISOString(),
        addedCastings,
        toppedCastings,
        idRange: next > maxId + 1 ? { from: pad(maxId + 1), to: pad(next - 1) } : null,
      },
      null,
      2
    )
  );

  console.log(`records:  ${beforeRecords} -> ${db.length}  (+${addedRecords} new${skippedExisting ? `, ${skippedExisting} skipped (already present)` : ''})`);
  console.log(`variants: ${beforeVariants} -> ${countVariants(db)}  (+${addedVariants + toppedVariants})`);
  console.log(`  new-casting variants: ${addedVariants}`);
  console.log(`  year-add variants:    ${toppedVariants} across ${toppedUp} existing castings${addMisses ? ` (${addMisses} lnk not found)` : ''}`);
  console.log(`  ids assigned: ${pad(maxId + 1)} .. ${pad(next - 1)}`);
  console.log(`snapshot -> ${SNAPSHOT}`);
  console.log(`manifest -> ${MANIFEST}  (${addedCastings.length} new + ${toppedCastings.length} topped-up castings)`);
}

main();

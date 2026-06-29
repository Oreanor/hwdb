#!/usr/bin/env node
/*
 * dedup-malformed-lnk.js
 * ----------------------
 * Some castings exist twice: a malformed-lnk copy (apostrophe double-encoded,
 * e.g. "%2764_Riviera") from an early import, and a canonical-lnk twin from a
 * later merge ("'64_Buick_Riviera"). Same casting (same toy #).
 *
 * Merge each pair into the canonical (GOOD) entry:
 *   - keep the longer description (the hand-cleaned original is often richer);
 *   - migrate variants that exist ONLY in the malformed copy (newer years),
 *     keeping their ids + images;
 *   - drop the malformed entry.
 * The malformed copy's variants that the canonical already has are true image
 * duplicates -> their ids are written out for deletion on Supabase.
 *
 * Writes data/hw.json and scripts/output/supabase-delete-ids.json.
 * Does NOT touch Supabase or local image files.
 */
const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'hw.json');
const OUT = path.join('scripts', 'output', 'supabase-delete-ids.json');

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const decode = (l) => { try { return decodeURIComponent(l); } catch { return l; } };
const sig = (v) => (v.y || '') + '|' + (v.c || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Two entries are the SAME casting only if their variant signatures overlap a
// lot — a shared toy # alone is a coincidence (numbers repeat across castings).
const overlap = (a, b) => {
  const sb = new Set(b.d.map(sig));
  const sa = [...new Set(a.d.map(sig))];
  if (!sa.length) return 0;
  return sa.filter((s) => sb.has(s)).length / sa.length;
};

const bad = db.filter((c) => /%[0-9A-Fa-f]{2}/.test(c.lnk));
const pairs = [];
for (const a of bad) {
  const dec = decode(a.lnk);
  // Candidate twins: a decoded-lnk match, or a same-toy# entry. Prefer the
  // canonical (no %) one. Confirm it's really the same casting via overlap.
  const cands = db.filter((x) => x !== a && !pairs.some((p) => p[0] === x) &&
    (x.lnk === dec || decode(x.lnk) === dec || (x.num && x.num === a.num)));
  const b = cands
    .filter((x) => !/%[0-9A-Fa-f]{2}/.test(x.lnk))   // canonical twin preferred
    .concat(cands.filter((x) => /%[0-9A-Fa-f]{2}/.test(x.lnk)))
    .find((x) => overlap(a, x) >= 0.5);
  if (b) pairs.push([a, b]); // a = malformed (BAD), b = canonical (GOOD)
}

const deleteIds = [];
const remove = new Set();
let migrated = 0, dscCopied = 0;
for (const [a, b] of pairs) {
  // 1) keep the richer description + a real designer over "Unknown"/blank
  if ((a.dsc || '').length > (b.dsc || '').length) { b.dsc = a.dsc; dscCopied++; }
  if (a.ds && a.ds !== 'Unknown' && (!b.ds || b.ds === 'Unknown')) b.ds = a.ds;
  // 2) migrate variants unique to the malformed copy; the rest are dup images
  const gsig = new Set(b.d.map(sig));
  for (const v of a.d) {
    if (gsig.has(sig(v))) { if (v.id) deleteIds.push(v.id); }
    else { b.d.push(v); gsig.add(sig(v)); migrated++; }
  }
  remove.add(a.lnk);
}

const cleaned = db.filter((c) => !remove.has(c.lnk));
fs.writeFileSync(DB, JSON.stringify(cleaned));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(deleteIds, null, 2));

console.log(`pairs merged: ${pairs.length} | entries removed: ${remove.size}`);
console.log(`description copied from original: ${dscCopied} | variants migrated: ${migrated}`);
console.log(`duplicate images to delete on Supabase: ${deleteIds.length} -> ${OUT}`);
console.log(`db castings: ${db.length} -> ${cleaned.length}`);

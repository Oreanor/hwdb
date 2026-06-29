#!/usr/bin/env node
/*
 * merge-brand.js
 * --------------
 * Merges scraped castings for a brand (scripts/output/parsed/<brand>/*.json)
 * into that brand's data file (data/<brand>.json), assigning GLOBALLY unique
 * variant ids — continuing the sequence across ALL brand files, because ids key
 * the image catalog and user collections and must never collide between brands.
 *
 * New castings are appended; castings already present (by lnk) are skipped.
 * The `brand` stamp is NOT stored in the file — the app loader applies it per
 * file, so the file stays a plain list of castings.
 *
 * Usage: node scripts/sync/merge-brand.js <hw|mb|mj>
 */

const fs = require('fs');
const path = require('path');
const { BRANDS, getBrand } = require('../lib/brands');

const pad = (n) => String(n).padStart(5, '0');
const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback);

function globalMaxId() {
  let max = 0;
  for (const b of Object.values(BRANDS)) {
    for (const c of readJson(b.dataFile, [])) {
      for (const v of c.d || []) {
        const n = Number(v.id);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }
  }
  return max;
}

function main() {
  const brand = getBrand(process.argv[2]);
  const parsedDir = path.join('scripts', 'output', 'parsed', brand.key);
  if (!fs.existsSync(parsedDir)) {
    console.error(`no scraped castings at ${parsedDir} — run scrape-brand.js first`);
    process.exit(1);
  }

  const db = readJson(brand.dataFile, []);
  const byLnk = new Set(db.map((c) => c.lnk));
  let next = globalMaxId() + 1;

  let addedCastings = 0;
  let addedVariants = 0;
  let skipped = 0;
  for (const file of fs.readdirSync(parsedDir).filter((f) => f.endsWith('.json'))) {
    const c = readJson(path.join(parsedDir, file), null);
    if (!c || !c.d || c.d.length === 0) { skipped++; continue; } // not a casting (no versions table)
    if (byLnk.has(c.lnk)) { skipped++; continue; }
    const d = c.d.map((v) => {
      const { brand: _b, ...rest } = v; // never store the per-variant stray brand
      return { ...rest, id: pad(next++) };
    });
    db.push({
      lnk: c.lnk,
      ...(c.ds ? { ds: c.ds } : {}),
      ...(c.num ? { num: c.num } : {}),
      ...(c.dsc ? { dsc: c.dsc } : {}),
      d,
    });
    byLnk.add(c.lnk);
    addedCastings++;
    addedVariants += d.length;
  }

  fs.writeFileSync(brand.dataFile, JSON.stringify(db, null, 2));
  console.log(`${brand.name}: +${addedCastings} castings, +${addedVariants} variants (skipped ${skipped}) -> ${brand.dataFile}`);
  console.log(`total castings now: ${db.length}`);
}

main();

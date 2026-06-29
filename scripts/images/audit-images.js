#!/usr/bin/env node
/*
 * audit-images.js
 * ---------------
 * Offline image-coverage report across the whole DB. For every variant a "have"
 * is p:'t' (live on Supabase) OR a local webp in images/webp2. Reports per-
 * casting coverage (full / partial / none) and writes the list of castings that
 * are missing images for some variants — those are the ones a per-variant
 * fetch (fetch-missing-images.js) can still top up.
 *
 * Usage: node scripts/audit-images.js
 */

const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'hw.json');
const WEBP = path.join('images', 'webp2');
const OUT = path.join('scripts', 'output', 'missing-images-report.json');

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const local = new Set(fs.existsSync(WEBP) ? fs.readdirSync(WEBP).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, '')) : []);
const has = (v) => v.p === 't' || (v.id && local.has(v.id));

let totVars = 0, haveVars = 0;
let full = 0, partial = 0, none = 0, noVariants = 0;
const missing = [];
for (const c of db) {
  const d = c.d ?? [];
  if (!d.length) { noVariants++; continue; }
  const withImg = d.filter(has).length;
  totVars += d.length;
  haveVars += withImg;
  if (withImg === d.length) full++;
  else {
    if (withImg === 0) none++; else partial++;
    missing.push({ lnk: c.lnk, variants: d.length, have: withImg, missingIds: d.filter((v) => !has(v)).map((v) => v.id) });
  }
}

fs.writeFileSync(OUT, JSON.stringify(missing, null, 2));
const pct = (n, d) => (d ? (n / d * 100).toFixed(1) : '0') + '%';
console.log(`variants:  ${haveVars}/${totVars} have an image (${pct(haveVars, totVars)}) | missing ${totVars - haveVars}`);
console.log(`castings:  ${full} fully imaged | ${partial} partial | ${none} none | ${noVariants} no variants`);
console.log(`  castings missing some images: ${missing.length} (variants: ${missing.reduce((s, m) => s + (m.variants - m.have), 0)})`);
console.log(`[+] missing list -> ${OUT}`);

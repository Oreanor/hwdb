#!/usr/bin/env node
/*
 * set-image-flags.js
 * ------------------
 * Sets `p: 't'` (has-image) on every variant of a brand whose `{id}.webp` exists
 * in the local image catalog (images/<brand>/). In cloud mode the flag means
 * "the image is live", so for a production deploy run this only after the files
 * are uploaded (upload-cloudinary.js for MB/MJ/Welly, Supabase for Hot Wheels).
 *
 * Writes data/<brand>.json in place (backup to scripts/output/).
 *
 * Usage: node scripts/images/set-image-flags.js <hw|mb|mj|we>
 */

const fs = require('fs');
const path = require('path');
const { getBrand, imageDirs } = require('../lib/brands');

const brand = getBrand(process.argv[2] || 'hw');
const DB = brand.dataFile;
const WEBP = imageDirs(brand.key).full;
const BACKUP = path.join('scripts', 'output', `${brand.key}.pre-imageflags.json`);

if (!fs.existsSync(WEBP)) {
  console.error(`No webp folder at ${WEBP}.`);
  process.exit(1);
}

const ids = new Set(
  fs.readdirSync(WEBP).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, ''))
);
console.log(`webp files: ${ids.size}`);

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
let set = 0;
let already = 0;
for (const c of db) {
  for (const v of c.d ?? []) {
    if (v.id && ids.has(v.id)) {
      if (v.p === 't') already++;
      else {
        v.p = 't';
        set++;
      }
    }
  }
}

fs.copyFileSync(DB, BACKUP);
fs.writeFileSync(DB, JSON.stringify(db, null, 2));
console.log(`p='t' set on ${set} variants (${already} already had it)`);
console.log(`backup -> ${BACKUP}`);

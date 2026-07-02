#!/usr/bin/env node
/*
 * upload-cloudinary.js
 * --------------------
 * Uploads the local per-brand FULL images to Cloudinary so the app can serve
 * them from a free CDN. Public ids mirror the paths getImageUrl builds:
 *   images/<brand>/<id>.webp -> <brand>/<id>
 * Previews are NOT uploaded — Cloudinary generates them on the fly as a width
 * transform of the full image (see getPreviewUrl).
 *
 * Then set NEXT_PUBLIC_IMG_BASE=https://res.cloudinary.com/<cloud>/image/upload
 *
 * Reads CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET from .env.local.
 * Resumable: uploaded public ids are recorded in scripts/output/.
 *
 * Usage: node scripts/images/upload-cloudinary.js [brand]   (default: all)
 */

const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// Standalone node doesn't auto-load .env.local.
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const BRANDS = ['mb', 'mj', 'we']; // Hot Wheels stays on Supabase (Cloudinary free tier)
const DONE_FILE = path.join('scripts', 'output', 'cloudinary-uploaded.json');

function collect(brands) {
  const jobs = [];
  for (const b of brands) {
    const dir = path.join('images', b); // full images only; previews are transforms
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.webp')) continue;
      const id = f.replace(/\.webp$/, '');
      jobs.push({ file: path.join(dir, f), publicId: `${b}/${id}` });
    }
  }
  return jobs;
}

async function main() {
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.error('Missing CLOUDINARY_API_SECRET in .env.local');
    process.exit(1);
  }
  const only = process.argv[2];
  const jobs = collect(only ? [only] : BRANDS);
  const done = new Set(fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) : []);
  console.log(`${jobs.length} files (${done.size} already uploaded)`);

  let up = 0, skip = 0, fail = 0, n = 0;
  const save = () => fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
  for (const j of jobs) {
    if (done.has(j.publicId)) { skip++; continue; }
    try {
      await cloudinary.uploader.upload(j.file, { public_id: j.publicId, overwrite: false, resource_type: 'image' });
      done.add(j.publicId);
      up++;
    } catch (e) {
      fail++;
      if (fail <= 8) console.log(`\n  fail ${j.publicId}: ${e.message}`);
    }
    if (++n % 100 === 0) { save(); process.stdout.write(`\r  up ${up} | skip ${skip} | fail ${fail}   `); }
  }
  save();
  console.log(`\n[+] uploaded ${up}, skipped ${skip}, failed ${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

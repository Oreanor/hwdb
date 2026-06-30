#!/usr/bin/env node
/*
 * fetch-brand-images.js
 * ---------------------
 * Downloads a brand's variant images from its wiki and encodes them to webp.
 * Unlike the Hot Wheels fetcher, MB/MJ variants already carry `_img` (the wiki
 * File: name) from the scrape, so no page re-parsing is needed — we resolve the
 * File: to a URL, download, and write images/webp2/{id}.webp + a 256px preview.
 *
 * Globally-unique ids mean these sit alongside the Hot Wheels images.
 * Resumable: a variant whose webp already exists is skipped.
 *
 * Usage: node scripts/images/fetch-brand-images.js <hw|mb|mj> [maxImages]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { getBrand } = require('../lib/brands');

const HEADERS = { 'User-Agent': 'HWDB-research/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 400;
const MAX = 800;
const QUALITY = 80;
const THUMB = 256;
const MIN_DIMENSION = 250;

const WEBP_DIR = path.join('images', 'webp2');
const PREV_DIR = path.join('images', 'webp2', 'preview');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isPlaceholder = (f) => /image[\s_]*not[\s_]*available|no[\s_]*image|placeholder/i.test(f);

async function resolveUrls(api, files) {
  const result = {};
  for (let i = 0; i < files.length; i += 50) {
    const chunk = files.slice(i, i + 50);
    try {
      const res = await fetch(
        `${api}?` + new URLSearchParams({ action: 'query', titles: chunk.map((f) => 'File:' + f).join('|'), prop: 'imageinfo', iiprop: 'url', format: 'json' }),
        { headers: HEADERS }
      );
      const q = (await res.json()).query ?? {};
      const norm = {};
      for (const n of q.normalized ?? []) norm[n.from] = n.to;
      const byTitle = {};
      for (const p of Object.values(q.pages ?? {})) if (p.imageinfo?.[0]) byTitle[p.title] = p.imageinfo[0].url;
      for (const f of chunk) { const t = norm['File:' + f] ?? 'File:' + f; if (byTitle[t]) result[f] = byTitle[t]; }
    } catch { /* skip this chunk */ }
    process.stdout.write(`\r  resolving ${Math.min(i + 50, files.length)}/${files.length}   `);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');
  return result;
}

async function main() {
  const brand = getBrand(process.argv[2]);
  const limit = process.argv[3] ? Number(process.argv[3]) : Infinity;
  for (const d of [WEBP_DIR, PREV_DIR]) fs.mkdirSync(d, { recursive: true });
  const localIds = new Set(fs.readdirSync(WEBP_DIR).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, '')));

  const db = JSON.parse(fs.readFileSync(brand.dataFile, 'utf8'));
  const jobs = [];
  for (const c of db) {
    for (const v of c.d ?? []) {
      if (!v.id || !v._img || isPlaceholder(v._img) || localIds.has(v.id)) continue;
      jobs.push({ id: v.id, file: v._img });
    }
  }
  const slice = jobs.slice(0, limit);
  console.log(`${brand.name}: ${slice.length} image jobs (of ${jobs.length} missing)`);

  const urlMap = await resolveUrls(brand.api, [...new Set(slice.map((j) => j.file))]);
  let done = 0, small = 0, skip = 0;
  for (const j of slice) {
    const url = urlMap[j.file];
    if (!url) { skip++; continue; }
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) { skip++; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (Math.max(meta.width ?? 0, meta.height ?? 0) < MIN_DIMENSION) { small++; continue; }
      await sharp(buf).resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(path.join(WEBP_DIR, `${j.id}.webp`));
      await sharp(buf).resize({ width: THUMB, height: THUMB, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).webp({ quality: 72 }).toFile(path.join(PREV_DIR, `${j.id}.webp`));
      done++;
    } catch { skip++; }
    if ((done + skip + small) % 50 === 0) process.stdout.write(`\r  downloaded ${done} | small ${small} | skip ${skip} / ${slice.length}   `);
    await sleep(200);
  }
  process.stdout.write('\n');
  console.log(`[+] ${brand.name}: downloaded ${done} (webp + preview), placeholder/small ${small}, skipped ${skip}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

#!/usr/bin/env node
/*
 * fetch-missing-images.js
 * -----------------------
 * Image-only top-up: for every casting that currently has NO image at all
 * (no variant flagged `p:'t'` and no local webp), re-parse its wiki page, map
 * the Photo column (File:) to our variant ids by position, download + encode
 * webp (<=800px) into images/webp2 and a 256px preview into images/webp2/preview.
 *
 * Does NOT touch data/carsdata.json. After uploading the new files to Supabase,
 * run set-image-flags.js to flip `p:'t'`.
 *
 * Resumable: variants whose webp already exists are skipped.
 *
 * Usage: node scripts/fetch-missing-images.js [maxCastings]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { fetchWikitext, parseCasting } = require('./parse-casting');

const API = 'https://hotwheels.fandom.com/api.php';
const HEADERS = { 'User-Agent': 'HWDB-collection-sync/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 300;
const MAX = 800;
const QUALITY = 80;
const THUMB = 256;
const MIN_DIMENSION = 250;

const DB = path.join('data', 'carsdata.json');
const WEBP_DIR = path.join('images', 'webp2');
const PREV_DIR = path.join('images', 'webp2', 'preview');
const ORIG_DIR = path.join('scripts', 'output', 'images', 'originals');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveUrls(files) {
  const result = {};
  for (let i = 0; i < files.length; i += 50) {
    const chunk = files.slice(i, i + 50);
    const res = await fetch(
      `${API}?` + new URLSearchParams({ action: 'query', titles: chunk.map((f) => 'File:' + f).join('|'), prop: 'imageinfo', iiprop: 'url', format: 'json' }),
      { headers: HEADERS }
    );
    const q = (await res.json()).query ?? {};
    const norm = {};
    for (const n of q.normalized ?? []) norm[n.from] = n.to;
    const byTitle = {};
    for (const p of Object.values(q.pages ?? {})) if (p.imageinfo?.[0]) byTitle[p.title] = p.imageinfo[0].url;
    for (const f of chunk) { const t = norm['File:' + f] ?? 'File:' + f; if (byTitle[t]) result[f] = byTitle[t]; }
    process.stdout.write(`\r  resolving ${Math.min(i + 50, files.length)}/${files.length}   `);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');
  return result;
}

async function main() {
  const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;
  for (const d of [WEBP_DIR, PREV_DIR, ORIG_DIR]) fs.mkdirSync(d, { recursive: true });
  const localIds = new Set(fs.readdirSync(WEBP_DIR).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, '')));

  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const targets = db.filter((c) => !(c.d ?? []).some((v) => v.p === 't' || localIds.has(v.id)));
  console.log(`castings with no image: ${targets.length}`);

  // Phase 1 — parse pages, map File: -> variant id (by position).
  const jobs = [];
  let parsed = 0, mismatch = 0, pageFail = 0, noImg = 0;
  for (const c of targets) {
    if (parsed >= limit) break;
    parsed++;
    let r;
    try { r = parseCasting(await fetchWikitext(c.lnk)); } catch { pageFail++; await sleep(SLEEP_MS); continue; }
    const vars = c.d ?? [];
    if (r.variants.length !== vars.length) { mismatch++; await sleep(SLEEP_MS); continue; }
    let added = 0;
    for (let i = 0; i < vars.length; i++) {
      if (r.variants[i]._img && vars[i].id && !localIds.has(vars[i].id)) { jobs.push({ id: vars[i].id, file: r.variants[i]._img }); added++; }
    }
    if (!added) noImg++;
    if (parsed % 25 === 0) process.stdout.write(`\r  parsed ${parsed}/${Math.min(limit, targets.length)} | jobs ${jobs.length} | mismatch ${mismatch} | pageFail ${pageFail}   `);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');
  console.log(`image jobs: ${jobs.length} | mismatch ${mismatch} | pageFail ${pageFail} | parsed-no-img ${noImg}`);

  // Phase 2 — resolve + download + encode webp + preview.
  const urlMap = await resolveUrls([...new Set(jobs.map((j) => j.file))]);
  let done = 0, small = 0, skip = 0;
  for (const j of jobs) {
    const url = urlMap[j.file];
    if (!url) { skip++; continue; }
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) { skip++; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (Math.max(meta.width ?? 0, meta.height ?? 0) < MIN_DIMENSION) { small++; continue; }
      const ext = (j.file.match(/\.(\w+)$/)?.[1] ?? 'jpg').toLowerCase();
      fs.writeFileSync(path.join(ORIG_DIR, `${j.id}.${ext}`), buf);
      await sharp(buf).resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(path.join(WEBP_DIR, `${j.id}.webp`));
      await sharp(buf).resize({ width: THUMB, height: THUMB, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).webp({ quality: 72 }).toFile(path.join(PREV_DIR, `${j.id}.webp`));
      done++;
    } catch { skip++; }
    if ((done + skip + small) % 25 === 0) process.stdout.write(`\r  downloaded ${done} | small ${small} | skip ${skip} / ${jobs.length}   `);
    await sleep(150);
  }
  process.stdout.write('\n');
  console.log(`[+] done. downloaded ${done} (webp + preview), placeholder ${small}, skipped ${skip}`);
  console.log('[+] upload images/webp2 + images/webp2/preview to Supabase, then run set-image-flags.js');
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

#!/usr/bin/env node
/*
 * fetch-images.js
 * ---------------
 * Downloads variant images from the Hot Wheels Wiki for variants that don't
 * have one yet (no `p` flag) — i.e. the newly added castings and the 2025-2026
 * year-adds — and re-encodes them to webp named by variant id.
 *
 *   originals -> scripts/output/images/originals/{id}.{ext}
 *   webp      -> scripts/output/images/webp/{id}.webp   (upload to Supabase webp2/)
 *
 * Re-parses each casting page to map the Photo column (File:) to our variant ids
 * (by position, falling back to a year-subset for existing castings). Resumable:
 * variants whose webp already exists are skipped. Does NOT set `p` — do that
 * after uploading the webp files to Supabase.
 *
 * Usage: node scripts/fetch-images.js [maxCastings]   (omit for all)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { fetchWikitext, parseCasting } = require('./parse-casting');

const API = 'https://hotwheels.fandom.com/api.php';
const HEADERS = { 'User-Agent': 'HWDB-collection-sync/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 350;
const MAX_W = 800; // match the existing webp2 images (longest side <= 800)
const MAX_H = 800;
const QUALITY = 80;
const MIN_DIMENSION = 250; // below this it's a reused wiki placeholder/thumbnail, not a real photo

const DB = path.join('data', 'carsdata.json');
const ORIG_DIR = path.join('scripts', 'output', 'images', 'originals');
// New webp join the full local catalog (same place as the old ones, gitignored).
const WEBP_DIR = path.join('images', 'webp2');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(params) {
  const res = await fetch(`${API}?${new URLSearchParams(params)}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// Resolve bare File names -> full image URLs (batched, handles title normalization).
async function resolveUrls(files) {
  const result = {};
  for (let i = 0; i < files.length; i += 50) {
    const chunk = files.slice(i, i + 50);
    const data = await apiGet({
      action: 'query',
      titles: chunk.map((f) => 'File:' + f).join('|'),
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
    });
    const q = data.query ?? {};
    const norm = {};
    for (const n of q.normalized ?? []) norm[n.from] = n.to;
    const urlByTitle = {};
    for (const p of Object.values(q.pages ?? {})) {
      if (p.imageinfo?.[0]) urlByTitle[p.title] = p.imageinfo[0].url;
    }
    for (const f of chunk) {
      const title = norm['File:' + f] ?? 'File:' + f;
      if (urlByTitle[title]) result[f] = urlByTitle[title];
    }
    process.stdout.write(`\r  resolving urls ${Math.min(i + 50, files.length)}/${files.length}`);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');
  return result;
}

async function main() {
  const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;
  fs.mkdirSync(ORIG_DIR, { recursive: true });
  fs.mkdirSync(WEBP_DIR, { recursive: true });

  // Target exactly what we added: new castings (all variants) and the 2025-26
  // year-adds on existing castings (the appended tail of those records).
  const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : []);
  const newSet = new Set(readJson(path.join('scripts', 'output', 'new_castings_data.json')).map((c) => c.lnk));
  const addsMap = new Map(readJson(path.join('scripts', 'output', 'existing_year_additions.json')).map((a) => [a.lnk, a]));

  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const targets = [];
  for (const c of db) {
    if (newSet.has(c.lnk)) {
      targets.push({ lnk: c.lnk, mode: 'full', vars: c.d ?? [], record: c, isNew: true });
    } else if (addsMap.has(c.lnk)) {
      const a = addsMap.get(c.lnk);
      targets.push({
        lnk: c.lnk,
        mode: 'years',
        years: new Set(a.addYears.map(String)),
        vars: (c.d ?? []).slice(-a.d.length),
        record: c,
        isNew: false,
      });
    }
  }
  console.log(`castings to refresh + image: ${targets.length} (new + year-adds)`);

  // Phase 1 — re-parse pages: refresh variant fields AND map File: -> id.
  // Sr is intentionally EXCLUDED — series were already cleaned (crystallize +
  // any manual edits) and must not be overwritten with raw wiki values.
  const FIELDS = ['y', 'N', 'c', 'Tm', 'Bs', 'Wn', 'In', 'Wh', 'Tn', 'Cn', 'Nt'];
  const jobs = [];
  let parsedCount = 0;
  let refreshed = 0;
  let mismatches = 0;
  let pageFails = 0;
  for (const t of targets) {
    if (parsedCount >= limit) break;
    parsedCount++;
    let r;
    try {
      r = parseCasting(await fetchWikitext(t.lnk));
    } catch {
      pageFails++;
      await sleep(SLEEP_MS);
      continue;
    }
    const parsed = r.variants;

    // New casting -> align all by index; year-add -> align the year-subset.
    const candidates = t.mode === 'full' ? parsed : parsed.filter((v) => t.years.has(String(v.y)));
    if (candidates.length !== t.vars.length) {
      mismatches++;
      await sleep(SLEEP_MS);
      continue;
    }
    // Overwrite descriptive fields from the (now-correct) parse, keeping id, p and Sr.
    for (let i = 0; i < t.vars.length; i++) {
      const src = candidates[i];
      const dst = t.vars[i];
      for (const k of FIELDS) {
        if (src[k] != null && src[k] !== '') dst[k] = src[k];
        else delete dst[k];
      }
      if (src._img && dst.id) jobs.push({ id: dst.id, file: src._img });
      refreshed++;
    }
    if (t.isNew) {
      if (r.designer) t.record.ds = r.designer;
      else delete t.record.ds;
      if (r.number) t.record.num = r.number;
      else delete t.record.num;
      if (r.description) t.record.dsc = r.description;
      else delete t.record.dsc;
    }
    if (parsedCount % 25 === 0) {
      process.stdout.write(
        `\r  parsed ${parsedCount}/${Math.min(limit, targets.length)} | refreshed ${refreshed} | mapped ${jobs.length} | mismatch ${mismatches} | pageFail ${pageFails}`
      );
    }
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');

  // Persist refreshed fields (full runs only — a sampled run is partial).
  if (limit === Infinity) {
    fs.copyFileSync(DB, path.join('scripts', 'output', 'carsdata.pre-reparse.json'));
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
    console.log(`[+] fields refreshed on ${refreshed} variants; DB written (backup: carsdata.pre-reparse.json)`);
  } else {
    console.log(`[sample] would refresh ${refreshed} variants (DB not written for sampled run)`);
  }

  const todo = jobs.filter((j) => !fs.existsSync(path.join(WEBP_DIR, `${j.id}.webp`)));
  console.log(`mapped image jobs: ${jobs.length} | to download: ${todo.length}`);

  // Phase 2 — resolve urls, download originals, encode webp.
  const urlMap = await resolveUrls([...new Set(todo.map((j) => j.file))]);

  let downloaded = 0;
  let skipped = 0;
  let skippedSmall = 0;
  for (const j of todo) {
    const url = urlMap[j.file];
    if (!url) {
      skipped++;
      continue;
    }
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        skipped++;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (Math.max(meta.width ?? 0, meta.height ?? 0) < MIN_DIMENSION) {
        skippedSmall++; // reused wiki placeholder / thumbnail — not a real photo
        continue;
      }
      const ext = (j.file.match(/\.(\w+)$/)?.[1] ?? 'jpg').toLowerCase();
      fs.writeFileSync(path.join(ORIG_DIR, `${j.id}.${ext}`), buf);
      await sharp(buf)
        .resize({ width: MAX_W, height: MAX_H, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(path.join(WEBP_DIR, `${j.id}.webp`));
      downloaded++;
    } catch {
      skipped++;
    }
    if ((downloaded + skipped) % 25 === 0) {
      process.stdout.write(`\r  downloaded ${downloaded} | skipped ${skipped} / ${todo.length}`);
    }
    await sleep(150);
  }
  process.stdout.write('\n');

  console.log(`[+] done. downloaded ${downloaded}, skipped(placeholder) ${skippedSmall}, skipped(no url) ${skipped}, mismatches ${mismatches}, pageFails ${pageFails}`);
  console.log(`[+] originals -> ${ORIG_DIR}`);
  console.log(`[+] webp -> ${WEBP_DIR}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

#!/usr/bin/env node
/*
 * check-casting-years.js
 * ----------------------
 * For every casting already in our DB, checks which production years the wiki
 * lists that we are missing (including 2026).
 *
 * Signal: each casting page is categorized as "<year> Hot Wheels" for every year
 * it was released. We read those categories (prop=categories, batched) and diff
 * the wiki year set against the years we have for that casting.
 *
 * Usage:
 *   node scripts/check-casting-years.js [path/to/db.json]
 *
 * Output: scripts/output/castings_missing_years.json
 *         [{ lnk, wikiTitle, ourYears, wikiYears, missingYears }, ...]
 *         (only castings that are missing at least one year)
 */

const fs = require('fs');
const path = require('path');

const API = 'https://hotwheels.fandom.com/api.php';
const HEADERS = { 'User-Agent': 'HWDB-collection-sync/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 400;
const BATCH = 50;
const MIN_YEAR = 1968;
const MAX_YEAR = 2026;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(params) {
  const url = `${API}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// Pull all 4-digit years within range out of an arbitrary string.
function extractYears(value) {
  const out = [];
  const re = /\d{4}/g;
  let m;
  while ((m = re.exec(String(value ?? ''))) !== null) {
    const y = Number(m[0]);
    if (y >= MIN_YEAR && y <= MAX_YEAR) out.push(y);
  }
  return out;
}

// A category like "1995 Hot Wheels" -> 1995. Decades ("1960s"), anniversaries,
// "(2011)" suffixes etc. don't start with a bare 4-digit-year + space, so they
// are ignored.
function yearFromCategory(title) {
  const m = /^Category:(\d{4})\s/.exec(title);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= MIN_YEAR && y <= MAX_YEAR ? y : null;
}

// Fetch wiki year-set for a batch of casting titles. Returns Map<inputLnk, Set<year>|null>
// (null = page missing on the wiki).
async function fetchWikiYears(lnks) {
  const fromTo = {};            // normalized + redirect mapping: input title -> resolved title
  const pageYears = {};         // resolved page title -> Set<year>
  const pageSeen = new Set();

  let cont = {};
  for (;;) {
    const data = await apiGet({
      action: 'query',
      prop: 'categories',
      titles: lnks.join('|'),
      redirects: '1',
      cllimit: '500',
      format: 'json',
      ...cont,
    });
    const q = data.query ?? {};
    for (const n of q.normalized ?? []) fromTo[n.from] = n.to;
    for (const r of q.redirects ?? []) fromTo[r.from] = r.to;
    for (const page of Object.values(q.pages ?? {})) {
      if (page.missing !== undefined) continue;
      pageSeen.add(page.title);
      const set = (pageYears[page.title] ??= new Set());
      for (const c of page.categories ?? []) {
        const y = yearFromCategory(c.title);
        if (y) set.add(y);
      }
    }
    if (data.continue) {
      cont = data.continue;
      await sleep(SLEEP_MS);
    } else {
      break;
    }
  }

  const resolve = (title) => {
    let t = title;
    for (let i = 0; i < 5 && fromTo[t] !== undefined; i++) t = fromTo[t];
    return t;
  };

  const result = new Map();
  for (const lnk of lnks) {
    const resolved = resolve(lnk);
    result.set(lnk, pageSeen.has(resolved) ? pageYears[resolved] : null);
  }
  return result;
}

async function main() {
  const dbPath = process.argv[2] || path.join('data', 'carsdata.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  // Our year-set per casting.
  const ourYears = new Map(); // lnk -> Set<year>
  for (const rec of db) {
    if (!rec.lnk) continue;
    const set = new Set();
    for (const v of rec.d ?? []) for (const y of extractYears(v.y)) set.add(y);
    ourYears.set(rec.lnk, set);
  }

  const lnks = [...ourYears.keys()];
  console.log(`[*] castings in DB: ${lnks.length}`);
  console.log('[*] querying wiki year categories...');

  const report = [];
  let missingPages = 0;
  for (let i = 0; i < lnks.length; i += BATCH) {
    const batch = lnks.slice(i, i + BATCH);
    const wiki = await fetchWikiYears(batch);
    for (const lnk of batch) {
      const wikiSet = wiki.get(lnk);
      if (wikiSet === null) {
        missingPages++;
        continue;
      }
      const ours = ourYears.get(lnk);
      const missing = [...wikiSet].filter((y) => !ours.has(y)).sort((a, b) => a - b);
      if (missing.length > 0) {
        report.push({
          lnk,
          ourYears: [...ours].sort((a, b) => a - b),
          wikiYears: [...wikiSet].sort((a, b) => a - b),
          missingYears: missing,
        });
      }
    }
    process.stdout.write(`\r    processed ${Math.min(i + BATCH, lnks.length)}/${lnks.length}`);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');

  report.sort((a, b) => b.missingYears.length - a.missingYears.length);

  const outDir = path.join('scripts', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'castings_missing_years.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');

  const missing2026 = report.filter((r) => r.missingYears.includes(2026)).length;
  const totalGaps = report.reduce((s, r) => s + r.missingYears.length, 0);

  console.log(`[+] castings with missing years: ${report.length}`);
  console.log(`[+] total missing (casting, year) gaps: ${totalGaps}`);
  console.log(`[+] castings missing 2026 specifically: ${missing2026}`);
  console.log(`[!] casting pages not found on wiki: ${missingPages}`);
  console.log(`[+] wrote -> ${outPath}`);
  console.log('\ntop 15 by number of missing years:');
  for (const r of report.slice(0, 15)) {
    console.log(`    ${r.lnk}: missing ${r.missingYears.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

#!/usr/bin/env node
/*
 * find-missing-castings.js
 * ------------------------
 * Finds Hot Wheels Wiki casting pages that are NOT in our database.
 *
 * Every casting page transcludes Template:Casting. We ask the MediaWiki API for
 * the full list of such pages (list=embeddedin) — that is the complete set of
 * castings on the wiki — then diff it against the `lnk` keys in our DB. What is
 * left over is the set of castings we are missing (premium-only ones included).
 *
 * Node port of the original Python script (Python is not installed locally and
 * Node is the project runtime). Uses the global fetch from Node 18+, no deps.
 *
 * Usage:
 *   node scripts/find-missing-castings.js [path/to/db.json]
 *
 * Input  : our JSON — an array of objects, each with a "lnk" key.
 * Output : scripts/output/missing_castings.json — [{ title, slug }, ...]
 *          feed those slugs into the existing casting-page parser.
 */

const fs = require('fs');
const path = require('path');

const API = 'https://hotwheels.fandom.com/api.php';
// Fandom dislikes anonymous bots — identify with a real contact.
const HEADERS = { 'User-Agent': 'HWDB-collection-sync/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 500; // pause between requests to stay polite

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalize a casting key for comparison: %xx-decode, _<->space, casefold.
function norm(title) {
  let t;
  try {
    t = decodeURIComponent(String(title));
  } catch {
    t = String(title);
  }
  return t.replace(/_/g, ' ').trim().toLowerCase();
}

// Page title -> slug in our `lnk` format (underscores instead of spaces).
const toSlug = (title) => title.replace(/ /g, '_');

async function apiGet(params) {
  const url = `${API}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  return res.json();
}

// Full list of ns=0 pages transcluding Template:Casting.
async function allCastingTitles() {
  const titles = [];
  let cont = {};
  for (;;) {
    const data = await apiGet({
      action: 'query',
      list: 'embeddedin',
      eititle: 'Template:Casting',
      einamespace: '0',
      eilimit: '500',
      format: 'json',
      ...cont,
    });
    for (const m of data.query.embeddedin) titles.push(m.title);
    if (data.continue) {
      cont = data.continue;
      process.stdout.write(`\r    fetched ${titles.length} titles...`);
      await sleep(SLEEP_MS);
    } else {
      break;
    }
  }
  process.stdout.write('\n');
  return titles;
}

// Collapse redirects: alias -> real title (so an alias is not a separate casting).
async function resolveRedirects(titles) {
  const mapping = {};
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const data = await apiGet({
      action: 'query',
      redirects: '1',
      titles: chunk.join('|'),
      format: 'json',
    });
    for (const red of data.query?.redirects ?? []) mapping[red.from] = red.to;
    process.stdout.write(`\r    resolved ${Math.min(i + 50, titles.length)}/${titles.length} redirects...`);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');
  return mapping;
}

function loadExisting(dbPath) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const keys = new Set();
  for (const rec of db) {
    if (rec.lnk) keys.add(norm(rec.lnk));
  }
  return keys;
}

async function main() {
  const dbPath = process.argv[2] || path.join('data', 'hw.json');

  console.log(`[*] reading our DB: ${dbPath}`);
  const existing = loadExisting(dbPath);
  console.log(`    castings in DB: ${existing.size}`);

  console.log('[*] pulling the full casting list from the wiki (Template:Casting)...');
  const wikiTitles = await allCastingTitles();
  console.log(`    casting pages on the wiki: ${wikiTitles.length}`);

  console.log('[*] resolving redirects...');
  const redir = await resolveRedirects(wikiTitles);
  const canonical = [];
  const seen = new Set();
  for (const t of wikiTitles) {
    const real = redir[t] ?? t;
    if (!seen.has(norm(real))) {
      seen.add(norm(real));
      canonical.push(real);
    }
  }

  const missing = canonical.filter((t) => !existing.has(norm(t))).sort();
  const out = missing.map((t) => ({ title: t, slug: toSlug(t) }));

  const outDir = path.join('scripts', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'missing_castings.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');

  console.log(`[+] missing castings: ${missing.length}`);
  console.log(`[+] wrote -> ${outPath}`);
  console.log('\nfirst 20:');
  for (const t of missing.slice(0, 20)) console.log('   ', t);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

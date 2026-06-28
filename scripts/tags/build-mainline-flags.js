#!/usr/bin/env node
/*
 * build-mainline-flags.js
 * -----------------------
 * Marks mainline variants (`m: 1`) per VARIANT using the authoritative
 * "List of YYYY Hot Wheels" wiki pages. Each list row gives, per mainline
 * release: casting link (Model Name), Series, Toy # and Col.#.
 *
 * A variant of year Y is mainline when it matches a row of year Y by EITHER:
 *   1) same casting link AND same series   (the primary, robust signal — the
 *      series is what separates a mainline release from a premium one of the
 *      same casting, e.g. "HW Flames" vs "Hot Wheels Boulevard"); OR
 *   2) same toy # AND same collection number; OR
 *   3) same casting link AND same collection number  (catches early years where
 *      the series naming drifted and the toy # is dirty, but the "X / 250"
 *      collection number still lines up).
 *
 * Year lists are cached to scripts/output/year-lists.json (pass --refresh to
 * re-fetch). Writes data/carsdata.json in place (backup to scripts/output/).
 *
 * Usage: node scripts/build-mainline-flags.js [--refresh]
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext } = require('../lib/parse-casting');

const DB = path.join('data', 'carsdata.json');
const BACKUP = path.join('scripts', 'output', 'carsdata.pre-mainline.json');
const CACHE = path.join('scripts', 'output', 'year-lists.json');
const FIRST_YEAR = 1968;
const LAST_YEAR = 2026;
const SLEEP_MS = 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Canonical casting key — bridges our URL-encoded lnk ("%2767_Camaro") and the
// list's Model Name link ("'67_Camaro").
const keyOf = (lnk) => {
  let s = lnk.replace(/_/g, ' ');
  try { s = decodeURIComponent(s); } catch { /* bad escape: keep as-is */ }
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
};

// Normalise a series name for fuzzy comparison (drop "HW"/"Hot Wheels", year
// suffixes, punctuation, "Mini Collection"/"Series" noise).
const normSr = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/'''/g, '')
    .replace(/\(\d{4}\)/g, '')
    .replace(/\b(hw|hot wheels|mini collection|series)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// All series names in a Series cell: it mixes PLAIN TEXT (e.g. "HW City Works")
// with [[links]] (e.g. "[[2015 New Models]]"), often several joined by <br>.
// Take both, per <br> segment — link-only extraction misses the plain-text
// segment names, which is most of them.
const seriesTexts = (cell) => {
  const c = (cell || '').replace(/bgcolor=[^|]*\|/gi, '').replace(/style="[^"]*"\s*\|?/gi, '');
  const out = [];
  for (const part of c.split(/<br\s*\/?>/i)) {
    let m;
    const re = /\[\[([^\]]+)\]\]/g;
    while ((m = re.exec(part)) !== null) {
      const p = m[1].split('|');
      out.push(p[0]);
      if (p[1]) out.push(p[1]);
    }
    const plain = part
      .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
      .replace(/<[^>]+>/g, '')
      .replace(/'''/g, '')
      .replace(/[|]/g, ' ')
      .trim();
    if (plain) out.push(plain);
  }
  return out;
};

// The collection number from N: "X / D" -> "X", or a bare "X" (early years
// store just the number). Leading zeros stripped.
const posOf = (N) => {
  const t = (N || '').trim();
  let m = t.match(/^(\d{1,3})\s*\/\s*\d{2,3}$/);
  if (m) return m[1].replace(/^0+/, '') || '0';
  m = t.match(/^(\d{1,3})$/);
  if (m) return m[1].replace(/^0+/, '') || '0';
  return null;
};

const seriesMatch = (sr, set) => {
  const n = normSr(sr);
  if (!n) return false;
  if (set.has(n)) return true;
  for (const s of set) if (s.length > 3 && (s.includes(n) || n.includes(s))) return true;
  return false;
};

// Rows of a "List of YYYY Hot Wheels" page: {lnk, series[], toy, col}.
function extractYearList(wt) {
  const rows = [];
  const tableRe = /\{\|[\s\S]*?\n\|\}/g;
  let m;
  while ((m = tableRe.exec(wt)) !== null) {
    for (const block of m[0].split(/\n\|-/)) {
      const cells = block
        .split('\n')
        .filter((l) => { const t = l.trim(); return t.startsWith('|') && !t.startsWith('|}') && !t.startsWith('|+'); })
        .map((l) => l.trim().replace(/^\|/, ''));
      if (cells.length < 4) continue;
      const lm = (cells[2] || '').match(/\[\[([^\]|]+)/);
      if (!lm) continue;
      rows.push({
        lnk: keyOf(lm[1].trim().replace(/ /g, '_')),
        series: seriesTexts(cells[3]).map(normSr).filter(Boolean),
        toy: (cells[0] || '').trim().toUpperCase(),
        col: (cells[1] || '').replace(/\D/g, ''),
      });
    }
  }
  return rows;
}

async function loadYearLists(refresh) {
  if (!refresh && fs.existsSync(CACHE)) {
    const raw = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    const ok = Object.values(raw).every((v) => Array.isArray(v) && (v.length === 0 || v[0].lnk !== undefined));
    if (ok) {
      console.log(`[+] year lists loaded from cache (${Object.keys(raw).length} years)`);
      return raw;
    }
  }

  const yearData = {};
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    let wt;
    try {
      wt = await fetchWikitext(`List_of_${y}_Hot_Wheels`);
    } catch {
      continue;
    }
    yearData[y] = extractYearList(wt);
    process.stdout.write(`\r  fetched ${y} (rows ${yearData[y].length})    `);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');
  fs.writeFileSync(CACHE, JSON.stringify(yearData));
  console.log(`[+] year lists cached -> ${CACHE}`);
  return yearData;
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const yearData = await loadYearLists(refresh);

  // Build per-year lookups: casting -> merged series set, and a "toy|col" set.
  const index = {};
  for (const [y, rows] of Object.entries(yearData)) {
    const byLnk = new Map();
    const toyCol = new Set();
    const lnkCol = new Set();
    for (const r of rows) {
      if (!byLnk.has(r.lnk)) byLnk.set(r.lnk, new Set());
      for (const s of r.series) byLnk.get(r.lnk).add(s);
      if (r.toy && r.col) toyCol.add(`${r.toy}|${r.col}`);
      if (r.col) lnkCol.add(`${r.lnk}|${r.col}`);
    }
    index[y] = { byLnk, toyCol, lnkCol };
  }

  let marked = 0;
  for (const c of db) {
    const key = keyOf(c.lnk);
    for (const v of c.d ?? []) {
      const yi = index[v.y];
      let isMain = false;
      if (yi) {
        const series = yi.byLnk.get(key);
        const bySeries = series && seriesMatch(v.Sr, series);
        const pos = posOf(v.N);
        const byToyCol = !!(v.Tn && pos && yi.toyCol.has(`${String(v.Tn).toUpperCase()}|${pos}`));
        const byLnkCol = !!(pos && yi.lnkCol.has(`${key}|${pos}`));
        isMain = bySeries || byToyCol || byLnkCol;
      }
      if (isMain) {
        v.m = 1;
        marked++;
      } else {
        delete v.m;
      }
    }
  }

  fs.copyFileSync(DB, BACKUP);
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  console.log(`[+] mainline variants flagged (m=1): ${marked}`);
  console.log(`[+] backup -> ${BACKUP}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

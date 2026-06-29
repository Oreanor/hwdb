#!/usr/bin/env node
/*
 * propose-model-years.js
 * ----------------------
 * Proposes a model year for castings that have a make but no detected model year
 * (build-tags couldn't find one in the name / first sentence). Two signals:
 *   - Wikipedia "production" span for the model (used only when it's a tight,
 *     single-generation span — a "...–present" nameplate is ignored);
 *   - else the casting's first release year (a decent proxy: HW usually tools a
 *     car while it's current — "Diablo"/"Mustang" by first-casting year).
 *
 * Writes PROPOSALS only (scripts/output/model-year-proposals.json) for review —
 * does NOT touch the data. Resumable.
 *
 * Usage: node scripts/propose-model-years.js [maxCastings]
 */

const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'hw.json'); // browse tags are embedded on castings
const OUT = path.join('scripts', 'output', 'model-year-proposals.json');
const PROG = path.join('scripts', 'output', 'model-year-progress.json');
const H = { 'User-Agent': 'HWDB-research/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const firstYear = (c) => {
  const ys = (c.d || []).map((v) => v.y).filter((y) => /^\d{4}$/.test(y)).map(Number);
  return ys.length ? Math.min(...ys) : null;
};

// Parse the infobox "production"/"model_years" span -> { start, openEnded }.
function wikiSpan(wt) {
  const line = (wt.match(/\|\s*(?:production|model_years?)\s*=\s*([^\n|]+)/i) || [])[1] || '';
  const years = (line.match(/\b(19\d\d|20\d\d)\b/g) || []).map(Number);
  if (!years.length) return null;
  const openEnded = /present|current/i.test(line);
  return { start: Math.min(...years), end: openEnded ? null : Math.max(...years), openEnded };
}

async function wikiYear(model) {
  try {
    const u = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'parse', page: model, prop: 'wikitext', format: 'json', redirects: '1' });
    const d = await (await fetch(u, { headers: H })).json();
    if (d.error) return null;
    return wikiSpan(d.parse.wikitext['*']);
  } catch {
    return null;
  }
}

async function main() {
  const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const byLnk = new Map(db.map((c) => [c.lnk, c]));
  const tags = db.filter((c) => c.tags).map((c) => ({ lnk: c.lnk, ...c.tags }));
  const targets = tags.filter((t) => t.mk && !t.yr);

  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const prog = fs.existsSync(PROG) ? JSON.parse(fs.readFileSync(PROG, 'utf8')) : { done: [] };
  const done = new Set(prog.done);
  console.log(`make-no-year castings: ${targets.length} (done: ${done.size})`);

  let i = 0, viaWiki = 0, viaFirst = 0, none = 0;
  for (const t of targets) {
    if (done.has(t.lnk) || i >= limit) { if (i >= limit) break; continue; }
    i++;
    const c = byLnk.get(t.lnk);
    const fy = c ? firstYear(c) : null;
    const span = t.md ? await wikiYear(t.md) : null;
    let proposed = null, method = null;
    // Tight single-generation span (<=20y, not open-ended) -> trust the wiki year.
    if (span && !span.openEnded && span.end && span.end - span.start <= 20) { proposed = span.start; method = 'wiki'; viaWiki++; }
    // Last resort ("совсем непонятно"): the car is usually a year before the
    // casting or the same — so estimate firstCastingYear - 1.
    else if (fy) { proposed = fy - 1; method = 'first-casting'; viaFirst++; }
    else none++;
    if (proposed) out.push({ lnk: t.lnk, model: t.md || null, proposed, method, firstCasting: fy, wiki: span ? `${span.start}-${span.openEnded ? 'present' : span.end}` : null });
    done.add(t.lnk);
    if (i % 20 === 0) {
      process.stdout.write(`\r  ${i}/${targets.length} | wiki ${viaWiki} | first-casting ${viaFirst} | none ${none}   `);
      fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
      fs.writeFileSync(PROG, JSON.stringify({ done: [...done] }, null, 2));
    }
    if (t.md) await sleep(SLEEP_MS);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  fs.writeFileSync(PROG, JSON.stringify({ done: [...done] }, null, 2));
  process.stdout.write('\n');
  console.log(`[+] proposals: ${out.length} (wiki ${viaWiki}, first-casting ${viaFirst}, none ${none}) -> ${OUT}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

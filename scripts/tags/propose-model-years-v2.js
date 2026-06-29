#!/usr/bin/env node
/*
 * propose-model-years-v2.js
 * -------------------------
 * For castings with a make+model but still no year, look the car up on Wikipedia
 * and resolve a PRECISE year using a generation hint from the description/name:
 *   - "fourth-generation", "Mk IV", chassis codes (C4, W124, AE86) -> find that
 *     generation's year in the model's wiki article;
 *   - else a TIGHT (<=12y) single-generation production span from the infobox.
 * Wide nameplate spans with no generation hint are skipped (no blind guess).
 *
 * Writes proposals to scripts/output/model-year-proposals-v2.json (method
 * 'wiki-gen' or 'wiki-span'). Does NOT touch the data. Resumable.
 *
 * Usage: node scripts/propose-model-years-v2.js [maxCastings]
 */
const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'hw.json'); // browse tags are embedded on castings
const OUT = path.join('scripts', 'output', 'model-year-proposals-v2.json');
const PROG = path.join('scripts', 'output', 'model-year-v2-progress.json');
const H = { 'User-Agent': 'HWDB-research/1.0 (personal research; oreanor@gmail.com)' };
const SLEEP_MS = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

// Pull a generation hint from text: an ordinal-gen, "Mk N", or a chassis code.
function genHint(text) {
  const t = text || '';
  let m = t.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)[- ]gen\w*/i);
  if (m) return { kind: 'ord', n: ORD.indexOf(m[1].toLowerCase()) + 1 };
  m = t.match(/\bgen(?:eration)?\s*([1-9])\b/i);
  if (m) return { kind: 'ord', n: Number(m[1]) };
  m = t.match(/\bmk\.?\s*([ivx]+|\d)\b/i);
  if (m) { const v = m[1].toLowerCase(); return { kind: 'ord', n: ROMAN[v] || Number(v) || null }; }
  m = t.match(/\b([A-Z]{1,2}\d{2,3}|[CW]\d|AE\d{2}|FD\d|FC\d|S1[0-5]|R3[0-9]|Z3[0-9])\b/);
  if (m) return { kind: 'chassis', code: m[1] };
  return null;
}

async function wikitext(title) {
  try {
    const u = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'parse', page: title, prop: 'wikitext', format: 'json', redirects: '1' });
    const d = await (await fetch(u, { headers: H })).json();
    if (d.error) return null;
    return d.parse.wikitext['*'];
  } catch { return null; }
}

// The nameplate production span from the infobox.
function infoboxSpan(wt) {
  const line = (wt.match(/\|\s*(?:production|model_years?)\s*=\s*([^\n|]+)/i) || [])[1] || '';
  const ys = (line.match(/\b(19\d\d|20\d\d)\b/g) || []).map(Number);
  if (!ys.length) return null;
  const openEnded = /present|current/i.test(line);
  return { start: Math.min(...ys), end: openEnded ? null : Math.max(...ys), openEnded };
}

// First year stated next to the generation reference.
function genYear(wt, g) {
  let re;
  if (g.kind === 'ord' && g.n) {
    const w = ORD[g.n - 1];
    re = new RegExp(`(?:${w}[- ]generation|generation\\s+${g.n}\\b)[\\s\\S]{0,180}?\\b(19\\d\\d|20[0-2]\\d)\\b`, 'i');
  } else if (g.kind === 'chassis') {
    re = new RegExp(`\\b${g.code}\\b[\\s\\S]{0,90}?\\b(19\\d\\d|20[0-2]\\d)\\b`, 'i');
  }
  const m = re && wt.match(re);
  return m ? Number(m[1]) : null;
}

async function main() {
  const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const dsc = new Map(db.map((c) => [c.lnk, c.dsc || '']));
  const tags = db.filter((c) => c.tags).map((c) => ({ lnk: c.lnk, ...c.tags }));
  // ALL make+model castings (not just year-less ones): we also want to VERIFY the
  // years already assigned, so the output can be diffed against the current year.
  const targets = tags.filter((t) => t.mk && t.md && !(t.th || []).includes('Fantasy'));

  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const prog = fs.existsSync(PROG) ? JSON.parse(fs.readFileSync(PROG, 'utf8')) : { done: [] };
  const done = new Set(prog.done);
  console.log(`make+model castings to verify: ${targets.length} (done: ${done.size})`);

  let i = 0, viaGen = 0, viaSpan = 0, skip = 0, fail = 0;
  for (const t of targets) {
    if (done.has(t.lnk)) continue;
    if (i >= limit) break;
    i++;
    const text = (dsc.get(t.lnk) || '') + ' ' + t.lnk.replace(/_/g, ' ');
    const g = genHint(text);
    const wt = await wikitext(t.md);
    if (!wt) { fail++; done.add(t.lnk); await sleep(SLEEP_MS); continue; }
    const span = infoboxSpan(wt);
    let proposed = null, method = null;
    const gy = g ? genYear(wt, g) : null;
    if (gy && gy >= 1930 && gy <= 2026) { proposed = gy; method = 'wiki-gen'; viaGen++; }
    else if (span && !span.openEnded && span.end && span.end - span.start <= 12) { proposed = span.start; method = 'wiki-span'; viaSpan++; }
    else skip++;
    if (proposed) out.push({ lnk: t.lnk, model: t.md, proposed, current: t.yr ?? null, method, gen: g || null, wiki: span ? `${span.start}-${span.openEnded ? 'present' : span.end}` : null });
    done.add(t.lnk);
    if (i % 15 === 0) {
      process.stdout.write(`\r  ${i}/${targets.length} | gen ${viaGen} | span ${viaSpan} | skip ${skip} | fail ${fail}   `);
      fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
      fs.writeFileSync(PROG, JSON.stringify({ done: [...done] }, null, 2));
    }
    await sleep(SLEEP_MS);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  fs.writeFileSync(PROG, JSON.stringify({ done: [...done] }, null, 2));
  process.stdout.write('\n');
  console.log(`[+] proposals: ${out.length} (gen ${viaGen}, span ${viaSpan}, skip ${skip}, fail ${fail}) -> ${OUT}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

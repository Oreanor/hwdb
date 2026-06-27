#!/usr/bin/env node
/*
 * audit-recent-years.js
 * ---------------------
 * Re-parses every existing casting and reports which 2025/2026 variants the wiki
 * has that we are missing (matched by year + color + series). Output is in the
 * existing_year_additions.json format, so the merge step can append them.
 *
 * Run this after the parser fix (the "!"-marked photo cell bug made some pages
 * parse to zero variants, so their recent-year releases were silently skipped).
 *
 * Resumable. No DB writes.
 *
 * Usage: node scripts/audit-recent-years.js
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext, parseCasting } = require('./parse-casting');

const YEARS = new Set(['2025', '2026']);
const SLEEP_MS = 400;
const DB = path.join('data', 'carsdata.json');
const outPath = path.join('scripts', 'output', 'existing_year_additions.json');
const progressPath = path.join('scripts', 'output', 'audit_recent_progress.json');
const reportPath = path.join('scripts', 'output', 'recent_years_report.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sig = (v) => `${v.y}|${(v.c || '').toLowerCase().trim()}|${(v.Sr || '').toLowerCase().trim()}`;

async function main() {
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const records = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : [];
  const prog = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf8')) : { processed: [], failed: [] };
  const seen = new Set(prog.processed);
  const failed = prog.failed;
  const report = [];

  const save = () => {
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
    fs.writeFileSync(progressPath, JSON.stringify({ processed: [...seen], failed }, null, 2));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  };

  let i = 0, withMissing = 0, missingVars = 0;
  for (const c of db) {
    i++;
    if (seen.has(c.lnk)) continue;
    try {
      const r = parseCasting(await fetchWikitext(c.lnk));
      const wikiRecent = r.variants.filter((v) => YEARS.has(String(v.y)));
      const ourSigs = new Set((c.d ?? []).filter((v) => YEARS.has(String(v.y))).map(sig));
      const missing = wikiRecent.filter((v) => !ourSigs.has(sig(v)));
      if (missing.length) {
        const addYears = [...new Set(missing.map((v) => Number(v.y)))];
        records.push({ lnk: c.lnk, addYears, d: missing });
        report.push({ lnk: c.lnk, missing: missing.map((v) => `${v.y} ${v.c || ''} (${v.Sr || ''})`) });
        withMissing++;
        missingVars += missing.length;
      }
      seen.add(c.lnk);
    } catch {
      failed.push(c.lnk);
    }
    if (i % 25 === 0) { process.stdout.write(`\r  ${i}/${db.length} | castings missing 25/26: ${withMissing} (${missingVars} variants) | failed ${failed.length}   `); save(); }
    await sleep(SLEEP_MS);
  }
  save();
  process.stdout.write('\n');
  console.log(`[+] done. castings with missing 2025/26 variants: ${withMissing} (${missingVars} variants)`);
  console.log(`[+] additions -> ${outPath}  (feed to merge-into-db.js)`);
  console.log(`[+] human report -> ${reportPath}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

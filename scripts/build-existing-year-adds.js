#!/usr/bin/env node
/*
 * build-existing-year-adds.js
 * ---------------------------
 * For castings we already have but that are missing recent years (2025-2026,
 * from existing_add_2025_2026.json), parses the wiki page and keeps ONLY the
 * variants from those missing years. Output feeds the merge step, which appends
 * them to the existing casting's variant list.
 *
 * Resumable. No ids assigned here.
 *
 * Usage: node scripts/build-existing-year-adds.js
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext, parseCasting } = require('./parse-casting');

const SLEEP_MS = 350;
const inDir = path.join('scripts', 'output');
const addListPath = path.join(inDir, 'existing_add_2025_2026.json');
const outPath = path.join(inDir, 'existing_year_additions.json');
const progressPath = path.join(inDir, 'existing_year_adds_progress.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const targets = JSON.parse(fs.readFileSync(addListPath, 'utf-8'));

  const records = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : [];
  const prog = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, 'utf-8'))
    : { processed: [], failed: [] };
  const seen = new Set(prog.processed);
  const failed = prog.failed;

  let sinceSave = 0;
  const save = () => {
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
    fs.writeFileSync(progressPath, JSON.stringify({ processed: [...seen], failed }, null, 2));
  };

  console.log(`[*] castings to top up: ${targets.length} (already done: ${seen.size})`);

  for (const t of targets) {
    if (seen.has(t.lnk)) continue;
    const wantYears = new Set(t.addYears.map(String));
    try {
      const wt = await fetchWikitext(t.lnk);
      const r = parseCasting(wt);
      const newVariants = r.variants.filter((v) => wantYears.has(String(v.y)));
      if (newVariants.length > 0) {
        records.push({ lnk: t.lnk, addYears: t.addYears, d: newVariants });
      }
      seen.add(t.lnk);
    } catch (e) {
      failed.push({ lnk: t.lnk, error: e.message });
      seen.add(t.lnk);
    }

    if (++sinceSave >= 25) {
      sinceSave = 0;
      save();
      process.stdout.write(`\r    ${seen.size}/${targets.length} | with adds ${records.length} | failed ${failed.length}`);
    }
    await sleep(SLEEP_MS);
  }

  save();
  const variants = records.reduce((s, r) => s + r.d.length, 0);
  console.log(`\n[+] done. castings with year-adds: ${records.length} | new variants: ${variants} | failed: ${failed.length}`);
  console.log(`[+] wrote -> ${outPath}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

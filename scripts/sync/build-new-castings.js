#!/usr/bin/env node
/*
 * build-new-castings.js
 * ---------------------
 * Parses every casting in missing_castings.json into our schema and writes
 * new_castings_data.json. Castings that parse to 0 variants (track sets /
 * playsets / stubs — not cars) are dropped.
 *
 * Resumable: re-running picks up where it left off (skips slugs already done).
 * No ids / no image flags are assigned here — that happens at merge time.
 *
 * Usage: node scripts/build-new-castings.js
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext, parseCasting } = require('../lib/parse-casting');

const SLEEP_MS = 350;
const inDir = path.join('scripts', 'output');
const missingPath = path.join(inDir, 'missing_castings.json');
const outPath = path.join(inDir, 'new_castings_data.json');
const progressPath = path.join(inDir, 'new_castings_progress.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const missing = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));

  // Resume: load anything already parsed.
  const done = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : [];
  const prog = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, 'utf-8'))
    : { processed: [], dropped: 0, failed: [] };
  const seen = new Set(prog.processed);

  const records = done;
  let dropped = prog.dropped;
  const failed = prog.failed;

  let sinceSave = 0;
  const save = () => {
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
    fs.writeFileSync(progressPath, JSON.stringify({ processed: [...seen], dropped, failed }, null, 2));
  };

  console.log(`[*] castings to process: ${missing.length} (already done: ${seen.size})`);

  for (let i = 0; i < missing.length; i++) {
    const { slug } = missing[i];
    if (seen.has(slug)) continue;

    try {
      const wt = await fetchWikitext(slug);
      const r = parseCasting(wt);
      if (r.variants.length === 0) {
        dropped++; // track set / playset / stub — not a car
      } else {
        records.push({ lnk: slug, ds: r.designer, num: r.number, dsc: r.description, d: r.variants });
      }
      seen.add(slug);
    } catch (e) {
      failed.push({ slug, error: e.message });
      seen.add(slug);
    }

    if (++sinceSave >= 25) {
      sinceSave = 0;
      save();
      process.stdout.write(
        `\r    ${seen.size}/${missing.length} | kept ${records.length} | dropped ${dropped} | failed ${failed.length}`
      );
    }
    await sleep(SLEEP_MS);
  }

  save();
  console.log(
    `\n[+] done. kept castings: ${records.length} | dropped (non-car): ${dropped} | failed: ${failed.length}`
  );
  const variants = records.reduce((s, r) => s + r.d.length, 0);
  console.log(`[+] total new variants: ${variants}`);
  console.log(`[+] wrote -> ${outPath}`);
  if (failed.length) console.log(`[!] failures logged in ${progressPath}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

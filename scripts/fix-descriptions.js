#!/usr/bin/env node
/*
 * fix-descriptions.js
 * -------------------
 * Re-fetches castings whose stored description was cut at the old 800-char limit
 * (ends with "…") and replaces it with the full first paragraph from the wiki.
 *
 * Writes data/carsdata.json in place (backup to scripts/output/).
 *
 * Usage: node scripts/fix-descriptions.js
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext, parseCasting } = require('./parse-casting');

const DB = path.join('data', 'carsdata.json');
const BACKUP = path.join('scripts', 'output', 'carsdata.pre-descfix.json');
const SLEEP_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The old cap always appended "…", so that ending is the reliable marker
// (length alone gives false positives — real descriptions that are ~800 chars).
const isTruncated = (d) => !!d && d.endsWith('…');

async function main() {
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const targets = db.filter((c) => isTruncated(c.dsc));
  console.log(`truncated descriptions to fix: ${targets.length}`);

  let fixed = 0, unchanged = 0, failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    try {
      const r = parseCasting(await fetchWikitext(c.lnk));
      const full = r.description;
      if (full && full.length > (c.dsc || '').length) {
        c.dsc = full;
        fixed++;
      } else {
        unchanged++;
      }
    } catch {
      failed++;
    }
    if ((i + 1) % 20 === 0) process.stdout.write(`\r  ${i + 1}/${targets.length} (fixed ${fixed}, unchanged ${unchanged}, failed ${failed})   `);
    await sleep(SLEEP_MS);
  }
  process.stdout.write('\n');

  fs.copyFileSync(DB, BACKUP);
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  console.log(`[+] fixed ${fixed}, unchanged ${unchanged}, failed ${failed}`);
  console.log(`[+] backup -> ${BACKUP}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

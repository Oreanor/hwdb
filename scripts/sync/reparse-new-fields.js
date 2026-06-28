#!/usr/bin/env node
/*
 * reparse-new-fields.js
 * ---------------------
 * Re-parses the NEW castings (added by the merge — i.e. not present in the
 * pre-merge snapshot; the old ones were hand-cleaned and are left untouched) and
 * refreshes their per-variant fields with the rowspan-aware parser, so shared
 * (rowspan) cells are written onto every row and columns stay aligned.
 *
 * Safe: matches by POSITION only when the variant count is unchanged (preserves
 * id / p / m and the curated Sr). Castings whose variant count changed (rowspan
 * recovered extra rows) are reported, not modified — their image-id mapping
 * needs care.
 *
 * Resumable. Backup to scripts/output/.
 *
 * Usage: node scripts/reparse-new-fields.js [maxCastings]
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext, parseCasting } = require('../lib/parse-casting');

const DB = path.join('data', 'carsdata.json');
const PRE_MERGE = path.join('scripts', 'output', 'carsdata.pre-merge.json');
const BACKUP = path.join('scripts', 'output', 'carsdata.pre-reparsenew.json');
const MISMATCH = path.join('scripts', 'output', 'reparse_new_mismatch.json');
const PROGRESS = path.join('scripts', 'output', 'reparse_new_progress.json');
const SLEEP_MS = 300;

// Fields refreshed from the wiki. Sr (series) is excluded — curated/crystallized.
const FIELDS = ['y', 'N', 'c', 'Tm', 'Bs', 'Wn', 'In', 'Wh', 'Tn', 'Cn', 'Nt'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const oldLnks = new Set(JSON.parse(fs.readFileSync(PRE_MERGE, 'utf8')).map((c) => c.lnk));
  const targets = db.filter((c) => !oldLnks.has(c.lnk));

  const prog = fs.existsSync(PROGRESS) ? JSON.parse(fs.readFileSync(PROGRESS, 'utf8')) : { done: [] };
  const done = new Set(prog.done);
  const mismatches = fs.existsSync(MISMATCH) ? JSON.parse(fs.readFileSync(MISMATCH, 'utf8')) : [];

  console.log(`new castings: ${targets.length} (already done: ${done.size})`);

  let i = 0, refreshed = 0, fieldChanges = 0, pageFail = 0;
  const save = () => {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
    fs.writeFileSync(MISMATCH, JSON.stringify(mismatches, null, 2));
    fs.writeFileSync(PROGRESS, JSON.stringify({ done: [...done] }, null, 2));
  };

  fs.copyFileSync(DB, BACKUP);
  for (const c of targets) {
    if (done.has(c.lnk)) continue;
    if (i >= limit) break;
    i++;
    let r;
    try { r = parseCasting(await fetchWikitext(c.lnk)); } catch { pageFail++; await sleep(SLEEP_MS); continue; }
    const vars = c.d ?? [];
    if (r.variants.length !== vars.length) {
      mismatches.push({ lnk: c.lnk, db: vars.length, wiki: r.variants.length });
    } else {
      for (let k = 0; k < vars.length; k++) {
        const src = r.variants[k];
        const dst = vars[k];
        for (const f of FIELDS) {
          const v = src[f];
          const had = dst[f];
          if (v != null && String(v).trim() !== '') { if (dst[f] !== v) fieldChanges++; dst[f] = v; }
          else if (had != null) { delete dst[f]; fieldChanges++; }
        }
      }
      refreshed++;
    }
    done.add(c.lnk);
    if (i % 25 === 0) { process.stdout.write(`\r  ${i}/${targets.length} | refreshed ${refreshed} | field-changes ${fieldChanges} | count-mismatch ${mismatches.length} | pageFail ${pageFail}   `); save(); }
    await sleep(SLEEP_MS);
  }
  save();
  process.stdout.write('\n');
  console.log(`[+] refreshed ${refreshed} castings | field changes ${fieldChanges} | count-mismatch ${mismatches.length} | pageFail ${pageFail}`);
  console.log(`[+] count-mismatch list -> ${MISMATCH}  (rowspan recovered rows; review/rebuild separately)`);
  console.log(`[+] backup -> ${BACKUP}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

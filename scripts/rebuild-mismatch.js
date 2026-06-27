#!/usr/bin/env node
/*
 * rebuild-mismatch.js
 * -------------------
 * For the castings flagged by reparse-new-fields as count-mismatched (the
 * rowspan-aware parser found MORE variants than we stored), appends the missing
 * (recovered) variants. Existing variants are left untouched — their id / p / m
 * and image links are preserved; we only ADD what was missing, matched by
 * year + color so we never duplicate one we already have.
 *
 * New variants get fresh sequential ids and no image flag (fetch their images
 * later with fetch-missing-images.js). Backup to scripts/output/.
 *
 * Usage: node scripts/rebuild-mismatch.js
 */

const fs = require('fs');
const path = require('path');
const { fetchWikitext, parseCasting } = require('./parse-casting');

const DB = path.join('data', 'carsdata.json');
const LIST = path.join('scripts', 'output', 'reparse_new_mismatch.json');
const BACKUP = path.join('scripts', 'output', 'carsdata.pre-mismatch.json');
const SLEEP_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(5, '0');
const sig = (v) => `${v.y}|${(v.c || '').toLowerCase().trim()}`;
const FIELDS = ['y', 'N', 'c', 'Sr', 'Tm', 'Bs', 'Wn', 'In', 'Wh', 'Tn', 'Cn', 'Nt'];

async function main() {
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const byLnk = new Map(db.map((c) => [c.lnk, c]));
  const list = JSON.parse(fs.readFileSync(LIST, 'utf8'));

  let maxId = 0;
  for (const c of db) for (const v of c.d || []) { const n = Number(v.id); if (n > maxId) maxId = n; }
  let next = maxId + 1;

  fs.copyFileSync(DB, BACKUP);
  let i = 0, addedVars = 0, touched = 0, fail = 0;
  for (const item of list) {
    i++;
    const c = byLnk.get(item.lnk);
    if (!c) continue;
    let fresh;
    try { fresh = parseCasting(await fetchWikitext(c.lnk)).variants; } catch { fail++; await sleep(SLEEP_MS); continue; }

    // Multiset of what we already have (by year+color).
    const have = new Map();
    for (const v of c.d) have.set(sig(v), (have.get(sig(v)) || 0) + 1);

    let added = 0;
    for (const fv of fresh) {
      const s = sig(fv);
      if (have.get(s) > 0) { have.set(s, have.get(s) - 1); continue; } // already have one
      const rec = { id: pad(next++) };
      for (const f of FIELDS) if (fv[f] != null && String(fv[f]).trim() !== '') rec[f] = fv[f];
      c.d.push(rec);
      added++;
    }
    if (added) { touched++; addedVars += added; }
    if (i % 20 === 0) {
      process.stdout.write(`\r  ${i}/${list.length} | castings topped up ${touched} | variants added ${addedVars} | fail ${fail}   `);
      fs.writeFileSync(DB, JSON.stringify(db, null, 2));
    }
    await sleep(SLEEP_MS);
  }
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  process.stdout.write('\n');
  console.log(`[+] done. castings topped up: ${touched} | variants added: ${addedVars} | ids ${pad(maxId + 1)}..${pad(next - 1)} | fail ${fail}`);
  console.log(`[+] backup -> ${BACKUP}`);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });

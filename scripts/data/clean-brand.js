#!/usr/bin/env node
/*
 * clean-brand.js
 * --------------
 * Brand-aware tidy-up of scraped data (data/<brand>.json). Currently:
 *   - pull "Serie: X" out of Notes into the Series field (Majorette stuffs the
 *     series into Notes, so Sr is otherwise nearly empty);
 *   - crystallize Series: strip card numbers (5/12, #16) the same way the Hot
 *     Wheels pipeline does;
 *   - move a leaked toy number out of Country into the Toy # field;
 *   - normalize known Country typos (Thailland / Yjailand -> Thailand).
 *
 * Writes in place with --apply (dry run otherwise; backup to scripts/output/).
 *
 * Usage: node scripts/data/clean-brand.js <hw|mb|mj> [--apply]
 */

const fs = require('fs');
const path = require('path');
const { getBrand } = require('../lib/brands');

const CN_TYPOS = { thailland: 'Thailand', yjailand: 'Thailand', thailand: 'Thailand', tailand: 'Thailand' };

// Same as scripts/data/crystallize-series.js: strip card numbers / mix codes.
function crystallize(s) {
  let t = s || '';
  t = t.replace(/\(?\d+\s*\/\s*\d+\)?/g, ' ').replace(/#\s*\d+/g, ' ').replace(/\(\s*mix[^)]*\)/gi, ' ').replace(/\(\s*\)/g, ' ');
  t = t.replace(/\s+/g, ' ').trim().replace(/^[/:\-–&,\s]+|[/:\-–&,\s]+$/g, '').trim();
  return t.replace(/\s+/g, ' ').trim();
}
// A bare toy-number/code (e.g. "JHV34", "MB424") with no spaces — not a country.
const isCode = (s) => /^[A-Z]{1,4}\d{2,}$/.test(s.trim());

function main() {
  const brand = getBrand(process.argv[2]);
  const apply = process.argv.includes('--apply');
  const db = JSON.parse(fs.readFileSync(brand.dataFile, 'utf8'));

  let serieToSr = 0;
  let cnFixed = 0;
  let srCrystallized = 0;
  let cnCodeMoved = 0;
  let whTidied = 0;
  let cTidied = 0;
  for (const c of db) {
    for (const v of c.d ?? []) {
      // "Serie: X" (often at the end of Notes, sometimes after other notes) -> Sr
      if (v.Nt) {
        const m = /\s*;?\s*serie\s*:\s*(.+)$/i.exec(v.Nt);
        if (m) {
          const series = m[1].trim();
          if (series && !v.Sr) { v.Sr = series; serieToSr++; }
          const rest = v.Nt.slice(0, m.index).replace(/[;,\s]+$/, '').trim();
          if (rest) v.Nt = rest; else delete v.Nt;
        }
      }
      // Crystallize the series (strip embedded card numbers).
      if (v.Sr) {
        const t = crystallize(v.Sr);
        if (t !== v.Sr) { srCrystallized++; if (t) v.Sr = t; else delete v.Sr; }
      }
      // A leaked toy code in Country -> Toy # (when free), then clear Country.
      if (v.Cn && isCode(v.Cn)) {
        if (!v.Tn) v.Tn = v.Cn.trim();
        delete v.Cn;
        cnCodeMoved++;
      } else if (v.Cn) {
        const fix = CN_TYPOS[v.Cn.trim().toLowerCase()];
        if (fix && fix !== v.Cn) { v.Cn = fix; cnFixed++; }
      }
      // Strip leaked leading/trailing separators on Wheels (from <br> splits:
      // "/ Brown", "Red /").
      if (v.Wh) {
        const t = v.Wh.replace(/^[/&,\s]+|[/&,\s]+$/g, '').trim();
        if (t !== v.Wh) { if (t) v.Wh = t; else delete v.Wh; whTidied++; }
      }
      // Normalize color separators ("Red/ Black" -> "Red / Black").
      if (v.c) {
        const t = v.c.replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
        if (t !== v.c) { v.c = t; cTidied++; }
      }
    }
  }

  const srCoverage = () => {
    let withSr = 0, total = 0;
    for (const c of db) for (const v of c.d ?? []) { total++; if (v.Sr) withSr++; }
    return `${withSr}/${total}`;
  };

  console.log(`${brand.name}: Serie:->Sr ${serieToSr} | Sr crystallized ${srCrystallized} | Cn code->Tn ${cnCodeMoved} | Cn typos ${cnFixed} | Wh tidied ${whTidied} | color tidied ${cTidied}`);
  console.log(`Sr coverage now: ${srCoverage()}`);

  if (!apply) { console.log('\n[dry run] nothing written. Re-run with --apply.'); return; }
  const backup = path.join('scripts', 'output', `${brand.key}.pre-clean.json`);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(brand.dataFile, backup);
  fs.writeFileSync(brand.dataFile, JSON.stringify(db, null, 2));
  console.log(`[applied] backup -> ${backup}; wrote ${brand.dataFile}`);
}

main();

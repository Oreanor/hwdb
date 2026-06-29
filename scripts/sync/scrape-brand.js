#!/usr/bin/env node
/*
 * scrape-brand.js
 * ---------------
 * Proof-of-concept multi-brand scraper. Pulls a few castings of ANY brand into
 * scripts/output/parsed/<brand>/, each stamped with `brand`, WITHOUT touching
 * the main database. Proves that Matchbox / Majorette pages map onto our schema
 * with the same header-driven parser.
 *
 * Usage:
 *   node scripts/sync/scrape-brand.js <hw|mb|mj> <slug> [slug...]
 *   node scripts/sync/scrape-brand.js mb Mustang_Fastback "Mustang Cobra"
 *   node scripts/sync/scrape-brand.js mj --discover 20   # scrape 20 real pages
 */

const fs = require('fs');
const path = require('path');
const { getBrand } = require('../lib/brands');
const { fetchWikitext, parseCasting } = require('../lib/parse-casting');

const HEADERS = { 'User-Agent': 'HWDB-research/1.0 (oreanor@gmail.com)' };

// Pull the first `n` content-namespace page titles from a brand's wiki. A
// rough way to sample castings without a curated title list; non-casting pages
// (no versions table) simply parse to 0 variants and are skipped at merge.
async function discoverPages(brand, n) {
  const url = `${brand.api}?${new URLSearchParams({
    action: 'query', list: 'allpages', apnamespace: '0', aplimit: String(n), format: 'json',
  })}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`allpages API ${res.status}`);
  const data = await res.json();
  return data.query.allpages.map((p) => p.title.replace(/ /g, '_'));
}

async function main() {
  const [brandKey, ...rest] = process.argv.slice(2);
  if (!brandKey || rest.length === 0) {
    console.error('usage: node scripts/sync/scrape-brand.js <hw|mb|mj> <slug...> | --discover <N>');
    process.exit(1);
  }
  const brand = getBrand(brandKey);
  const slugs = rest[0] === '--discover' ? await discoverPages(brand, Number(rest[1] || 20)) : rest;
  const outDir = path.join('scripts', 'output', 'parsed', brand.key);
  fs.mkdirSync(outDir, { recursive: true });

  let ok = 0;
  for (const slug of slugs) {
    try {
      const wt = await fetchWikitext(slug, brand);
      const r = parseCasting(wt, brand);
      // Same shape as a casting record, with the brand stamp up front.
      const rec = {
        brand: brand.key,
        lnk: slug,
        ...(r.designer ? { ds: r.designer } : {}),
        ...(r.number ? { num: r.number } : {}),
        ...(r.description ? { dsc: r.description } : {}),
        d: r.variants,
      };
      const outPath = path.join(outDir, `${slug.replace(/[^A-Za-z0-9_-]/g, '_')}.json`);
      fs.writeFileSync(outPath, JSON.stringify(rec, null, 2));
      ok++;
      console.log(`✓ ${brand.key}:${slug} — ${r.variants.length} variants` +
        `${r.totalMismatch ? `, ${r.totalMismatch} column-mismatch rows` : ''} -> ${outPath}`);
      for (const v of r.variants.slice(0, 2)) console.log('   ', JSON.stringify(v));
    } catch (e) {
      console.log(`✗ ${brand.key}:${slug} — ${e.message}`);
    }
    await new Promise((res) => setTimeout(res, 400));
  }
  console.log(`\n${ok}/${slugs.length} castings parsed for ${brand.name}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

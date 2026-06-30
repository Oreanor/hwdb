#!/usr/bin/env node
/*
 * scrape-welly.js
 * ---------------
 * Welly is a manufacturer catalog (wellydiecast.com), not a Fandom wiki, so it
 * has its own HTML scraper. It walks every subcategory listing (paginated),
 * extracts each product (name / item # / scale / photo), keeps only the 1:60
 * line, and groups products by name into castings (item numbers = variants),
 * writing the casting JSONs to scripts/output/parsed/we/ for merge-brand.js.
 *
 * Schema mapping: name -> casting; item_no -> Tn; scale -> Sr (so the scale
 * filter still works); photo path -> _img; a year in the name -> y.
 *
 * Usage: node scripts/sync/scrape-welly.js
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://www.wellydiecast.com';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (personal research; oreanor@gmail.com)' };
const SCALE = /1:60/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// One product = <div class="col" pid="N"> ... <img src="upload/product/...">
// <div class="name">..</div><div class="item_no">..</div><div class="scale">..</div>
function parseItems(html) {
  const items = [];
  const parts = html.split('<div class="col" pid="');
  for (let i = 1; i < parts.length; i++) {
    const c = parts[i];
    const pid = (c.match(/^(\d+)/) || [])[1];
    const img = (c.match(/<img src="(upload\/product\/[^"]+)"/) || [])[1] || '';
    const name = ((c.match(/class="name">([^<]*)</) || [])[1] || '').trim();
    const itemNo = ((c.match(/class="item_no">([^<]*)</) || [])[1] || '').trim();
    const scale = ((c.match(/class="scale">([^<]*)</) || [])[1] || '').trim();
    if (pid && name && itemNo) items.push({ pid, name, itemNo, scale, img });
  }
  return items;
}

async function main() {
  const home = await get(`${BASE}/product.php`);
  const subcats = [...new Set(home.match(/product\.php\?cid=\d+&sid=\d+/g) || [])];
  console.log(`subcategories: ${subcats.length}`);

  const byPid = new Map();
  for (const sc of subcats) {
    for (let page = 1; page <= 40; page++) {
      let items;
      try { items = parseItems(await get(`${BASE}/${sc}&page=${page}`)); }
      catch { break; }
      const fresh = items.filter((it) => !byPid.has(it.pid));
      for (const it of items) byPid.set(it.pid, it);
      await sleep(300);
      if (items.length === 0 || fresh.length === 0) break;
    }
    process.stdout.write(`\r  scanned, ${byPid.size} products so far   `);
  }
  process.stdout.write('\n');

  const all = [...byPid.values()];
  const target = all.filter((it) => SCALE.test(it.scale));
  console.log(`total products: ${all.length} | 1:60: ${target.length}`);

  const byName = new Map();
  for (const it of target) {
    if (!byName.has(it.name)) byName.set(it.name, []);
    byName.get(it.name).push(it);
  }

  const outDir = path.join('scripts', 'output', 'parsed', 'we');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  let castings = 0, variants = 0;
  for (const [name, its] of byName) {
    const lnk = name.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_().,'%-]/g, '');
    const year = (name.match(/\b(?:19|20)\d\d\b/) || [''])[0];
    const d = its.map((it) => ({ y: year, Sr: it.scale, Tn: it.itemNo, _img: it.img }));
    fs.writeFileSync(path.join(outDir, `${lnk.replace(/[^A-Za-z0-9_-]/g, '_')}.json`),
      JSON.stringify({ brand: 'we', lnk, d }, null, 2));
    castings++; variants += d.length;
  }
  console.log(`-> ${castings} castings / ${variants} variants -> ${outDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

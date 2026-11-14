#!/usr/bin/env node
/*
 * brands.js
 * ---------
 * Single source of per-brand specifics for the scraping pipeline (SRP). Every
 * brand-dependent value lives here; the parser, scraper and (later) the loader
 * depend on this `BrandConfig` abstraction rather than on hard-coded Hot Wheels
 * constants — so adding a brand is adding a config entry, not editing logic.
 *
 * Fields:
 *   key      short id, also the `brand` stamp on records and the data filename
 *   name     human label
 *   api      MediaWiki api.php endpoint
 *   wiki     page base (for "view on fandom" links)
 *   dataFile where this brand's castings are stored
 *   tableRequiresWikitableClass
 *            HW/Matchbox version tables carry class="wikitable"; Majorette's
 *            tables don't, so its table detection must not require the class.
 */

const path = require('path');

const BRANDS = {
  hw: {
    key: 'hw',
    name: 'Hot Wheels',
    api: 'https://hotwheels.fandom.com/api.php',
    wiki: 'https://hotwheels.fandom.com/wiki/',
    dataFile: 'data/hw.json',
    tableRequiresWikitableClass: true,
  },
  mb: {
    key: 'mb',
    name: 'Matchbox',
    api: 'https://matchbox.fandom.com/api.php',
    wiki: 'https://matchbox.fandom.com/wiki/',
    dataFile: 'data/mb.json',
    tableRequiresWikitableClass: true,
  },
  mj: {
    key: 'mj',
    name: 'Majorette',
    api: 'https://majorette-model-cars.fandom.com/api.php',
    wiki: 'https://majorette-model-cars.fandom.com/wiki/',
    dataFile: 'data/mj.json',
    tableRequiresWikitableClass: false,
  },
  // Welly is a manufacturer catalog (HTML), not a Fandom wiki — scraped by
  // scripts/sync/scrape-welly.js; only dataFile is used by the shared pipeline.
  we: {
    key: 'we',
    name: 'Welly',
    wiki: 'https://www.wellydiecast.com/',
    dataFile: 'data/we.json',
  },
};

function getBrand(key) {
  const b = BRANDS[key];
  if (!b) throw new Error(`unknown brand "${key}" (expected one of: ${Object.keys(BRANDS).join(', ')})`);
  return b;
}

/**
 * Where a brand's images live on disk. One layout for every brand:
 *
 *   images/<brand>/{id}.webp          full size (~800px), used in the lightbox
 *   images/<brand>/preview/{id}.webp  256px thumbnail for lists and grids
 *
 * This is exactly what the app asks for through /localimg and what
 * upload-cloudinary.js publishes, so the scripts, the local dev server and the
 * cloud bucket all agree on one set of paths.
 */
function imageDirs(key) {
  const base = path.join('images', getBrand(key).key);
  return { full: base, preview: path.join(base, 'preview') };
}

module.exports = { BRANDS, getBrand, imageDirs };

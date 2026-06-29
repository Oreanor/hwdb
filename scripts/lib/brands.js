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
};

function getBrand(key) {
  const b = BRANDS[key];
  if (!b) throw new Error(`unknown brand "${key}" (expected one of: ${Object.keys(BRANDS).join(', ')})`);
  return b;
}

module.exports = { BRANDS, getBrand };

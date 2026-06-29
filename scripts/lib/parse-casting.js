#!/usr/bin/env node
/*
 * parse-casting.js
 * ----------------
 * Parses a Hot Wheels Wiki casting page into our variant schema.
 *
 * Header-driven: reads the column headers of the "Versions" wikitable and maps
 * each column onto our short keys, so it works even though casting tables differ
 * in which columns they have.
 *
 * Usage:
 *   node scripts/parse-casting.js Custom_Camaro Twin_Mill ...   # specific slugs
 *
 * Output (per slug, to stdout): a summary + the first few parsed variants.
 * Returns records shaped like our CarDataItem (no id / no image flag yet).
 */

const { getBrand } = require('./brands');
const HW = getBrand('hw'); // default brand keeps every existing caller unchanged
const HEADERS = { 'User-Agent': 'HWDB-collection-sync/1.0 (personal research; oreanor@gmail.com)' };

// Wiki header keyword -> our key. Order matters: the specific "X Color" columns
// must be caught before the bare "Color" -> c rule.
const HEADER_RULES = [
  [/year/i, 'y'],
  [/series/i, 'Sr'],
  [/tampo/i, 'Tm'],
  [/toy\s*#|toy\s*number|toy\s*no/i, 'Tn'],
  [/base/i, 'Bs'],
  [/window/i, 'Wn'],
  [/interior/i, 'In'],
  [/wheel/i, 'Wh'],
  [/country/i, 'Cn'],
  [/note/i, 'Nt'],
  [/photo|image/i, '__photo__'],
  [/color|colour/i, 'c'],
  [/col\.?\s*#|^\s*#|number/i, 'N'],
];

function mapHeader(label) {
  for (const [re, key] of HEADER_RULES) if (re.test(label)) return key;
  return '__extra__'; // named column we have no slot for -> folded into Nt
}

// Strip wiki markup from a cell value. Returns { text, photo }.
function cleanCell(raw) {
  let s = raw;
  let photo = null;

  // [[File:Name.jpg|...]] / [[Image:...]] -> capture filename, drop from text.
  s = s.replace(/\[\[(?:File|Image):([^|\]]+)[^\]]*\]\]/gi, (_, f) => {
    if (!photo) photo = f.trim();
    return '';
  });
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ''); // footnotes
  s = s.replace(/<ref[^>]*\/>/gi, '');
  s = s.replace(/\[\[[^|\]]*\|([^\]]+)\]\]/g, '$1'); // [[target|label]] -> label
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1'); // [[target]] -> target
  s = s.replace(/'''/g, '').replace(/''/g, ''); // bold/italic
  s = s.replace(/\{\{[^{}]*\}\}/g, ''); // {{Hover|...}} and other templates
  s = s.replace(/<\s*\/?\s*br\b[^>]*>?/gi, ' / '); // <br>, <br/>, and malformed <br< / </br
  s = s.replace(/<[^>]*>/g, ''); // any other html tags
  s = s.replace(/[<>]/g, ' '); // stray angle brackets from malformed markup
  s = s
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"');
  let text = s.replace(/\s+/g, ' ').trim();
  // Consecutive <br> become empty " / " segments — drop them (but leave a lone
  // literal slash like "1/6" alone).
  if (/\/\s*\//.test(text)) {
    text = text.split('/').map((p) => p.trim()).filter(Boolean).join(' / ');
  }
  return { text, photo };
}

// A row's "cell" line may carry attributes: |rowspan="2"|value -> value.
function cellValue(line) {
  let s = line.replace(/^\|/, '');
  if (/\b(rowspan|colspan|style|align|width|class|scope|bgcolor)\b\s*=/.test(s) && s.includes('|')) {
    s = s.slice(s.indexOf('|') + 1);
  }
  const rowspan = /\browspan\s*=\s*"?(\d+)/.exec(line);
  const colspan = /\bcolspan\s*=\s*"?(\d+)/.exec(line);
  return { value: s, rowspan: rowspan ? Number(rowspan[1]) : 1, colspan: colspan ? Number(colspan[1]) : 1 };
}

async function fetchWikitext(slug, brand = HW) {
  // Some stored lnks are double-encoded ("%2764_Riviera", "Chevy_Monza_2%2B2");
  // decode once so the API resolves the real page title.
  if (/%[0-9A-Fa-f]{2}/.test(slug)) { try { slug = decodeURIComponent(slug); } catch { /* keep as-is */ } }
  const url = `${brand.api}?${new URLSearchParams({ action: 'parse', page: slug, prop: 'wikitext', format: 'json' })}`;
  // Retry on rate-limit / transient 5xx with exponential backoff.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) {
      const data = await res.json();
      if (data.error) throw new Error(data.error.info || 'parse error');
      return data.parse.wikitext['*'];
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    throw new Error(`API ${res.status}`);
  }
}

// Parse one wikitable block into { headers, rows: string[][], mismatches }.
function parseTable(block) {
  const lines = block.split('\n');
  const headers = [];
  let cur = null;
  let mismatches = 0;
  let inHeader = true; // header "!" cells appear before the first data row

  const rawRows = []; // each cell kept as {value, rowspan, colspan}
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('!') && inHeader) {
      // header cells, may be "!a!!b" inline or one per line
      for (const h of t.replace(/^!/, '').split('!!')) {
        const after = h.includes('|') ? h.slice(h.lastIndexOf('|') + 1) : h;
        headers.push(
          after.replace(/'''/g, '').replace(/<\s*\/?\s*br\b[^>]*>?/gi, ' ').replace(/<[^>]*>/g, '').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim()
        );
      }
    } else if (t === '|-' || t.startsWith('|-')) {
      if (headers.length) inHeader = false; // headers done; data rows follow
      if (cur) rawRows.push(cur);
      cur = [];
    } else if (cur && t.startsWith('|') && !t.startsWith('|}')) {
      for (const part of t.split('||')) cur.push(cellValue(part.startsWith('|') ? part : '|' + part));
    } else if (cur && t.startsWith('!') && !inHeader) {
      // A "!" line inside a data row is a mis-marked cell (e.g. a photo written
      // with "!" instead of "|") — treat it as a cell, not a header.
      cur.push(cellValue('|' + t.replace(/^!\s*/, '')));
    } else if (cur && cur.length > 0 && t && !t.startsWith('|') && !t.startsWith('!')) {
      // Continuation of a multi-line cell (e.g. Base "Black\n/\nPlastic").
      cur[cur.length - 1].value += ' ' + t;
    }
  }
  if (cur && cur.length) rawRows.push(cur);

  // Expand rowspan (fill a spanned cell DOWN its column) and colspan (widen) into
  // a fixed-width grid, so columns stay aligned when rows share a cell.
  const ncol = headers.length || Math.max(0, ...rawRows.map((r) => r.length));
  const carry = new Array(ncol).fill(null); // pending rowspans: {value, left}
  const rows = [];
  for (const raw of rawRows) {
    if (!raw.length) continue;
    const row = new Array(ncol).fill(undefined);
    for (let c = 0; c < ncol; c++) {
      if (carry[c] && carry[c].left > 0) { row[c] = carry[c].value; if (--carry[c].left <= 0) carry[c] = null; }
    }
    let col = 0;
    for (const cell of raw) {
      while (col < ncol && row[col] !== undefined) col++;
      if (col >= ncol) { mismatches++; break; }
      const span = Math.min(cell.colspan || 1, ncol - col);
      for (let k = 0; k < span; k++) {
        row[col] = cell.value;
        if ((cell.rowspan || 1) > 1) carry[col] = { value: cell.value, left: cell.rowspan - 1 };
        col++;
      }
    }
    rows.push(row.map((v) => (v === undefined ? '' : v)));
  }
  const dataRows = rows.filter((r) => r.some((c) => c !== ''));
  return { headers, rows: dataRows, mismatches };
}

// First prose paragraph of the Description section (fallback: page intro).
function extractDescription(wikitext) {
  let body = wikitext;
  const sec = /==\s*'*\s*Description\s*'*\s*==\s*([\s\S]*?)(?:\n==|$)/i.exec(wikitext);
  if (sec) {
    body = sec[1];
  } else {
    // text between the infobox and the first section header
    const after = wikitext.indexOf('}}');
    const head = wikitext.search(/\n==/);
    if (after >= 0) body = wikitext.slice(after + 2, head > after ? head : undefined);
  }
  body = body.replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[Category:[^\]]*\]\]/gi, '');
  const para = body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.length > 0) || '';
  const { text } = cleanCell(para);
  return text;
}

// Split template params on top-level '|' only — infobox fields may share a line
// (|number=N|designer=X), and values may contain '|' inside [[...]] / {{...}}.
function splitParams(s) {
  const out = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const nx = s[i + 1];
    if ((ch === '[' && nx === '[') || (ch === '{' && nx === '{')) {
      depth++;
      buf += ch + nx;
      i++;
    } else if ((ch === ']' && nx === ']') || (ch === '}' && nx === '}')) {
      depth = Math.max(0, depth - 1);
      buf += ch + nx;
      i++;
    } else if (ch === '|' && depth === 0) {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function parseCasting(wikitext, brand = HW) {
  // top-level info from the {{casting|...}} infobox
  const info = {};
  const m = /\{\{casting\s*\|([\s\S]*?)\}\}/i.exec(wikitext);
  if (m) {
    for (const field of splitParams(m[1])) {
      const eq = field.indexOf('=');
      if (eq > 0) info[field.slice(0, eq).trim().toLowerCase()] = field.slice(eq + 1).trim();
    }
  }

  const variants = [];
  let totalMismatch = 0;
  let hadRowspan = /rowspan/i.test(wikitext);

  // HW/Matchbox version tables are class="wikitable"; Majorette's aren't, so for
  // those brands match any "{| ... |}" table and rely on the Year-column guard
  // below to keep only the versions table(s).
  const tableRe = brand.tableRequiresWikitableClass
    ? /\{\|[^\n]*wikitable[\s\S]*?\n\|\}/g
    : /\{\|[\s\S]*?\n\|\}/g;
  let tm;
  while ((tm = tableRe.exec(wikitext)) !== null) {
    const { headers, rows, mismatches } = parseTable(tm[0]);
    // Map headers -> keys; if two columns map to the same slot (e.g. "Color" and
    // "Roof Color" both look like color), keep the first and fold the rest into Nt.
    const used = new Set();
    const keys = headers.map((h) => {
      let k = mapHeader(h);
      if (k !== '__photo__' && k !== '__extra__') {
        if (used.has(k)) k = '__extra__';
        else used.add(k);
      }
      return k;
    });
    // Only treat as a versions table if it has a Year column. For brands matched
    // by the loose (no-class) regex, also require a Color column — that rejects
    // wheel/rim reference tables that happen to carry a year-like column.
    if (!keys.includes('y')) continue;
    if (!brand.tableRequiresWikitableClass && !keys.includes('c')) continue;
    totalMismatch += mismatches;

    for (const row of rows) {
      if (row.length !== headers.length) continue; // skip rowspan-shifted rows for now
      const rec = {};
      const extras = [];
      row.forEach((cellRaw, i) => {
        const key = keys[i];
        const { text, photo } = cleanCell(cellRaw);
        if (key === '__photo__') {
          if (photo) rec._img = photo; // wiki File: name, used by the image fetcher
          return;
        }
        if (!text) return;
        if (key === '__extra__') {
          extras.push(`${headers[i]}: ${text}`);
        } else if (rec[key]) {
          rec[key] += ` / ${text}`;
        } else {
          rec[key] = text;
        }
      });
      if (extras.length) rec.Nt = [rec.Nt, ...extras].filter(Boolean).join('; ');
      // Some old/foreign tables put a catalog number in the Year column. Keep the
      // number (move to N if free) instead of treating it as a year or losing it.
      if (rec.y && /^\d+$/.test(rec.y)) {
        const n = Number(rec.y);
        if (n < 1968 || n > 2030) {
          if (!rec.N) rec.N = rec.y;
          delete rec.y;
        }
      }
      if (rec.y || rec.N) variants.push(rec);
    }
  }

  return {
    designer: cleanCell(info.designer || '').text || undefined,
    number: cleanCell(info.number || '').text || undefined,
    description: extractDescription(wikitext) || undefined,
    variants,
    totalMismatch,
    hadRowspan,
  };
}

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('usage: node scripts/parse-casting.js <slug> [slug...]');
    process.exit(1);
  }

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join('scripts', 'output', 'parsed');
  fs.mkdirSync(outDir, { recursive: true });

  for (const slug of slugs) {
    try {
      const wt = await fetchWikitext(slug);
      const r = parseCasting(wt);
      const outPath = path.join(outDir, `${slug.replace(/[^A-Za-z0-9_-]/g, '_')}.json`);
      fs.writeFileSync(outPath, JSON.stringify({ lnk: slug, ds: r.designer, num: r.number, dsc: r.description, d: r.variants }, null, 2));
      console.log(`\n=== ${slug} ===`);
      console.log(`  designer: ${r.designer ?? '-'} | number: ${r.number ?? '-'}`);
      console.log(`  variants parsed: ${r.variants.length} | column-mismatch rows: ${r.totalMismatch} | rowspan on page: ${r.hadRowspan}`);
      console.log(`  full dump -> ${outPath}`);
      for (const v of r.variants.slice(0, 3)) console.log('   ', JSON.stringify(v));
    } catch (e) {
      console.log(`\n=== ${slug} ===  FAILED: ${e.message}`);
    }
    await new Promise((res) => setTimeout(res, 400));
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { fetchWikitext, parseCasting, extractDescription };

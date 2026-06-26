#!/usr/bin/env node
/*
 * make-thumbs.js
 * --------------
 * Generates small WebP thumbnails from the full-size webp catalog images, for
 * the table/grid previews (the full webp is only needed in the lightbox).
 * Source images are ~800px; a 256px WebP is several times smaller, which is the
 * single biggest win for list/grid load time (see review item #1).
 *
 *   in : <input dir>/{id}.webp   (default images/webp2)
 *   out: <output dir>/{id}.webp  (default images/webp2/preview)
 *
 * Keeps the same id as the full image, so upload the result to Supabase as
 * webp2/preview/{id}.webp and point the app's thumbnail URL at that prefix.
 *
 * Resumable: existing thumbnails are skipped (pass --force to rebuild).
 * Runs one sharp job per CPU core.
 *
 * Usage:
 *   node scripts/make-thumbs.js [inputDir] [outputDir] [--force]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');

const THUMB_SIZE = 256; // longest side, covers the 192px card with retina headroom
const QUALITY = 72;
const SRC_EXT = /\.(webp|jpe?g|png)$/i;

const args = process.argv.slice(2).filter((a) => a !== '--force');
const FORCE = process.argv.includes('--force');
const INPUT_DIR = args[0] || path.join('images', 'webp2');
const OUTPUT_DIR = args[1] || path.join('images', 'webp2', 'preview');
const CONCURRENCY = Math.max(1, os.cpus().length - 1);

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`input dir not found: ${INPUT_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const all = fs.readdirSync(INPUT_DIR).filter((f) => SRC_EXT.test(f));
  const jobs = all.filter((f) => {
    const id = f.replace(SRC_EXT, '');
    return FORCE || !fs.existsSync(path.join(OUTPUT_DIR, `${id}.webp`));
  });
  console.log(`source images: ${all.length} | to build: ${jobs.length} | ${CONCURRENCY} workers`);

  let done = 0;
  let failed = 0;
  let inBytes = 0;
  let outBytes = 0;
  const queue = jobs.slice();

  async function worker() {
    while (queue.length) {
      const f = queue.pop();
      const id = f.replace(SRC_EXT, '');
      const src = path.join(INPUT_DIR, f);
      const dst = path.join(OUTPUT_DIR, `${id}.webp`);
      try {
        await sharp(src)
          .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'inside', withoutEnlargement: true })
          .flatten({ background: '#ffffff' }) // safety: solid bg if any image has alpha
          .webp({ quality: QUALITY })
          .toFile(dst);
        inBytes += fs.statSync(src).size;
        outBytes += fs.statSync(dst).size;
        done++;
      } catch (e) {
        failed++;
        if (failed <= 5) console.warn(`\n  fail ${f}: ${e.message}`);
      }
      if ((done + failed) % 100 === 0) {
        process.stdout.write(`\r  built ${done} | failed ${failed} / ${jobs.length}   `);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write('\n');

  const mb = (b) => (b / 1024 / 1024).toFixed(1);
  console.log(`[+] done. built ${done}, failed ${failed}`);
  if (done) {
    console.log(`[+] size of built set: ${mb(inBytes)}MB -> ${mb(outBytes)}MB webp (${(outBytes / inBytes * 100).toFixed(0)}%)`);
    console.log(`[+] avg thumbnail: ${(outBytes / done / 1024).toFixed(1)} KB`);
  }
  console.log(`[+] thumbnails -> ${OUTPUT_DIR}  (upload to Supabase webp2/preview/)`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

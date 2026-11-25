/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image URLs are built in the browser, so the image host must reach the client
  // bundle. It's public anyway (it is in every <img src>); `env` inlines it at
  // build time without the NEXT_PUBLIC_ prefix.
  env: {
    NEXT_IMG_BASE: process.env.NEXT_IMG_BASE ?? '',
  },
  images: {
    // Thumbnails are pre-made webp previews on our own hosts, so Next's image
    // optimizer adds nothing (and would need every host whitelisted).
    unoptimized: true,
  },
  // The dataset (data/{hw,mb,mj,we}.json + tags-index.json) is read with fs at
  // runtime; make sure every API function ships with it.
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/*.json'],
  },
};

module.exports = nextConfig;

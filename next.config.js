/** @type {import('next').NextConfig} */
const nextConfig = {
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

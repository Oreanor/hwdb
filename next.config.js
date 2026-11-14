/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || 'hwdb.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // The per-brand data files (data/hw.json, mb.json, ... — see app/lib/brands.ts)
  // live outside public/ and are read by a computed path, so they're neither
  // auto-served nor auto-traced. Bundle them into the API route functions for
  // deployment (Vercel). data/backup is excluded by the pattern.
  outputFileTracingIncludes: {
    ...Object.fromEntries(
      ['search', 'car', 'variants', 'options', 'series', 'series-cars', 'year-cars', 'stats'].map((route) => [
        `/api/${route}`,
        ['./data/*.json'],
      ])
    ),
    '/api/tags': ['./data/tags-index.json'],
  },
};

module.exports = nextConfig; 
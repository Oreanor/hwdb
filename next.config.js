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
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // carsdata.json lives outside public/, so it isn't auto-served or auto-traced.
  // Tell Next to bundle it into the API route functions for deployment (Vercel).
  outputFileTracingIncludes: {
    '/api/search': ['./data/carsdata.json', './data/casting-tags.json'],
    '/api/car': ['./data/carsdata.json', './data/casting-tags.json'],
    '/api/variants': ['./data/carsdata.json'],
    '/api/options': ['./data/carsdata.json'],
    '/api/series': ['./data/carsdata.json'],
    '/api/series-cars': ['./data/carsdata.json'],
    '/api/year-cars': ['./data/carsdata.json'],
    '/api/tags': ['./data/tags-index.json'],
  },
};

module.exports = nextConfig; 
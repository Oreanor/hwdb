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
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || 'hwdb.supabase.co',
      'localhost'
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig; 
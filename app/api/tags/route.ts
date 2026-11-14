import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { dataFile } from '../../lib/carsData';

// The browse index for the home page (brand -> category -> makes with counts).
// Static between deploys, so read once and cache.
let cache: string | null = null;

export async function GET() {
  // Cache only in production; re-read in dev so regenerated tags show up
  // without a server restart.
  const dev = process.env.NODE_ENV !== 'production';
  try {
    if (!cache || dev) cache = await fs.readFile(dataFile('tags-index.json'), 'utf-8');
  } catch (error) {
    // No index yet: the home page just shows no browse blocks.
    console.error('tags:', error);
    return NextResponse.json({});
  }
  return new NextResponse(cache, {
    headers: {
      'content-type': 'application/json',
      'cache-control': dev ? 'no-store' : 'public, max-age=3600',
    },
  });
}

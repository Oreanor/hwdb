import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// The browse index for the home page (category -> makes with counts). Static
// between deploys, so read once and cache.
let cache: string | null = null;

export async function GET() {
  try {
    // Cache only in production; re-read in dev so regenerated tags show up
    // without a server restart.
    const dev = process.env.NODE_ENV !== 'production';
    if (!cache || dev) {
      cache = await fs.readFile(path.join(process.cwd(), 'data', 'tags-index.json'), 'utf-8');
    }
    return new NextResponse(cache, {
      headers: {
        'content-type': 'application/json',
        'cache-control': dev ? 'no-store' : 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ regions: {}, themes: {} });
  }
}

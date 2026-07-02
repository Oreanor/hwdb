import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Dev-only static image host: serves files from the local images/ folder so all
// brands' webp show on localhost without a cloud bucket. Enabled by pointing
// NEXT_PUBLIC_IMG_BASE at "/localimg" (see utils.ts).
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const rel = parts.join('/');
  if (rel.includes('..')) return new NextResponse('bad request', { status: 400 });
  try {
    const buf = await fs.readFile(path.join(process.cwd(), 'images', rel));
    return new NextResponse(buf, {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' },
    });
  } catch {
    return new NextResponse('not found', { status: 404 });
  }
}

import { NextResponse } from 'next/server';

// The car dataset is static between deploys, so its read-only API responses can
// be cached at the CDN. s-maxage caches the shared response; stale-while-
// revalidate serves a slightly stale copy while refreshing in the background.
export const STATIC_CACHE_HEADERS = {
  'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

// A cacheable JSON response from the static dataset.
export const staticJson = (data: unknown) => NextResponse.json(data, { headers: STATIC_CACHE_HEADERS });

// The one error shape every API route returns: { error: "..." }.
export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// Logs an unexpected failure and answers 500 without leaking internals.
export const serverError = (route: string, err: unknown) => {
  console.error(`[${route}]`, err);
  return jsonError('Internal server error', 500);
};

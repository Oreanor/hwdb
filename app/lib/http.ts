import { NextResponse } from 'next/server';

// The car dataset is static between deploys, so its read-only API responses can
// be cached at the CDN. s-maxage caches the shared response; stale-while-
// revalidate serves a slightly stale copy while refreshing in the background.
export const STATIC_CACHE_HEADERS = {
  'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

// A cacheable JSON response for the static dataset.
export const staticJson = (body: unknown) => NextResponse.json(body, { headers: STATIC_CACHE_HEADERS });

export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });

// Logs the real error server-side; the client only gets a generic message
// (internal error text and paths stay out of public responses).
export const serverError = (context: string, error: unknown) => {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
};

// Wraps a route handler so an unexpected throw becomes a logged 500.
export const withErrors =
  <A extends unknown[]>(context: string, handler: (...args: A) => Promise<Response>) =>
  async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return serverError(context, error);
    }
  };

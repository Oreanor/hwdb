// The car dataset is static between deploys, so its read-only API responses can
// be cached at the CDN. s-maxage caches the shared response; stale-while-
// revalidate serves a slightly stale copy while refreshing in the background.
export const STATIC_CACHE_HEADERS = {
  'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

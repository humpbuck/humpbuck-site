/**
 * Default Cache-Control for storefront R2 objects (product media, avatars, etc.).
 * Same-key overwrites are visible after a normal refresh — never use 1-year / immutable.
 */
export const R2_STOREFRONT_CACHE_CONTROL = "public, max-age=0, must-revalidate";

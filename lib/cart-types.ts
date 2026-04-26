export type CartLine = {
  slug: string;
  qty: number;
  variantId?: string;
  variantLabel?: string;
  /** Optional line image for custom/non-catalog items. */
  variantImage?: string;
};

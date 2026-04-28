export type CartLine = {
  slug: string;
  qty: number;
  variantId?: string;
  variantLabel?: string;
  /** Snapshot name for admin-added products not in static catalog. */
  productName?: string;
  /** Snapshot unit price for admin-added products not in static catalog. */
  unitPrice?: number;
  /** Optional line image for custom/non-catalog items. */
  variantImage?: string;
};

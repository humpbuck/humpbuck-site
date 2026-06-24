/** Official HUMPBUCK social profiles (storefront). */
export const HUMPBUCK_SOCIAL_LINKS = [
  {
    id: "facebook",
    href: "https://www.facebook.com/humpbuckwatches",
  },
  {
    id: "instagram",
    href: "https://www.instagram.com/humpbuck/",
  },
  {
    id: "youtube",
    href: "https://www.youtube.com/@HUMPBUCK",
  },
  {
    id: "tiktok",
    href: "https://www.tiktok.com/@humpbuck",
  },
] as const;

export type HumpbuckSocialId = (typeof HUMPBUCK_SOCIAL_LINKS)[number]["id"];

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /**
       * Resolved URL to show in header: DB `image` (upload or preset) or Gravatar from email.
       * Matches `getBuyerAvatarDisplayUrl` used on product reviews.
       */
      displayAvatarUrl?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    picture?: string | null;
  }
}

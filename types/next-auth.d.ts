import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      displayName?: string | null;
      /** Resolved from first + last name → display name → email. */
      name?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  }
}

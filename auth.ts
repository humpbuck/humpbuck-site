import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { userPublicDisplayName } from "@/lib/user-display-name";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash,
        );
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email!,
          name: userPublicDisplayName(user),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
            },
          });
          if (dbUser) {
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.displayName = dbUser.displayName;
            token.email = dbUser.email ?? token.email;
            token.name = userPublicDisplayName(dbUser);
          }
        } catch {
          // Keep JWT session when DB is briefly unavailable (e.g. after router.refresh).
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | null) ?? null;
        const email = token.email as string | null | undefined;
        if (email != null) session.user.email = email;
        session.user.firstName = (token.firstName as string | null) ?? null;
        session.user.lastName = (token.lastName as string | null) ?? null;
        session.user.displayName = (token.displayName as string | null) ?? null;
      }
      return session;
    },
  },
});

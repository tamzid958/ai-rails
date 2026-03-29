import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";
import Google from "next-auth/providers/google";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@airails/shared";
import { redirect } from "next/navigation";
import type {} from "./auth-types";

const ALLOWED_DOMAINS = process.env.ALLOWED_EMAIL_DOMAINS
  ? process.env.ALLOWED_EMAIL_DOMAINS.split(",").map((d) => d.trim().toLowerCase())
  : [];

function isEmailAllowed(email: string): boolean {
  if (ALLOWED_DOMAINS.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    GitLab({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    MicrosoftEntraId({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? "common"}/v2.0`,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      if (!isEmailAllowed(user.email)) return "/unauthorized?reason=domain";
      return true;
    },
    async jwt({ token, account, profile }) {
      if (!account) return token;

      const email = token.email;
      if (!email) return token;

      const gitUsername =
        account.provider === "github"
          ? (profile as Record<string, unknown>)?.login as string | undefined
          : account.provider === "gitlab"
            ? (profile as Record<string, unknown>)?.username as string | undefined
            : undefined;

      let engineer = await prisma.engineer.findUnique({
        where: { email },
      });

      if (!engineer && gitUsername) {
        engineer = await prisma.engineer.findFirst({
          where: { gitUsername },
        });
      }

      if (!engineer) {
        engineer = await prisma.engineer.create({
          data: {
            email,
            name: token.name ?? email,
            gitUsername: gitUsername ?? null,
          },
        });
      } else if (!engineer.gitUsername && gitUsername) {
        engineer = await prisma.engineer.update({
          where: { id: engineer.id },
          data: { gitUsername },
        });
      }

      token.engineerId = engineer.id;
      token.gitUsername = engineer.gitUsername;

      return token;
    },
    async session({ session, token }) {
      session.user.engineerId = token.engineerId as string;
      session.user.gitUsername = (token.gitUsername as string | null) ?? null;
      return session;
    },
  },
});

export async function getEngineer() {
  const session = await auth();

  if (!session?.user?.engineerId) {
    redirect("/");
  }

  const engineer = await prisma.engineer.findUnique({
    where: { id: session.user.engineerId },
  });

  if (!engineer) {
    redirect("/");
  }

  return engineer;
}

/** API-safe variant — returns null instead of calling redirect() */
export async function getEngineerOrNull() {
  const session = await auth();

  if (!session?.user?.engineerId) {
    return null;
  }

  return prisma.engineer.findUnique({
    where: { id: session.user.engineerId },
  });
}

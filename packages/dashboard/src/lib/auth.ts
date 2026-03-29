import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";
import { prisma } from "@airails/shared";
import { redirect } from "next/navigation";
import type {} from "./auth-types";

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
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (!account) return token;

      const email = token.email;
      if (!email) return token;

      const gitUsername =
        account.provider === "github"
          ? (profile as Record<string, unknown>)?.login as string | undefined
          : (profile as Record<string, unknown>)?.username as string | undefined;

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

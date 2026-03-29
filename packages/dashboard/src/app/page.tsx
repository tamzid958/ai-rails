import { auth, signIn } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { redirect } from "next/navigation";
import { LoginView } from "@/components/login/login-view";

const INVITE_ONLY = process.env.INVITE_ONLY === "true";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.engineerId) {
    const memberships = await prisma.productMembership.findMany({
      where: { engineerId: session.user.engineerId },
      include: { product: { select: { slug: true } } },
    });

    if (memberships.length > 0) {
      redirect(`/${memberships[0].product.slug}/engineer`);
    }

    if (INVITE_ONLY) {
      redirect("/waiting");
    }

    redirect("/products");
  }

  const hasGitHub = !!process.env.GITHUB_CLIENT_ID;
  const hasGitLab = !!process.env.GITLAB_CLIENT_ID;
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID;
  const hasMicrosoft = !!process.env.MICROSOFT_CLIENT_ID;

  return (
    <LoginView
      signInGitHub={hasGitHub ? async () => {
        "use server";
        await signIn("github");
      } : undefined}
      signInGitLab={hasGitLab ? async () => {
        "use server";
        await signIn("gitlab");
      } : undefined}
      signInGoogle={hasGoogle ? async () => {
        "use server";
        await signIn("google");
      } : undefined}
      signInMicrosoft={hasMicrosoft ? async () => {
        "use server";
        await signIn("microsoft-entra-id");
      } : undefined}
    />
  );
}

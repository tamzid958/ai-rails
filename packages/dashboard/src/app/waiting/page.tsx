import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@airails/shared";
import { WaitingView } from "@/components/login/waiting-view";

export default async function WaitingPage() {
  const session = await auth();

  if (!session?.user?.engineerId) {
    redirect("/");
  }

  const memberships = await prisma.productMembership.findMany({
    where: { engineerId: session.user.engineerId },
    take: 1,
  });

  if (memberships.length > 0) {
    redirect("/products");
  }

  return (
    <WaitingView
      email={session?.user?.email ?? "unknown"}
      signOut={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    />
  );
}

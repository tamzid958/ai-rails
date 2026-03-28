import { auth, signIn } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.engineerId) {
    const memberships = await prisma.productMembership.findMany({
      where: { engineerId: session.user.engineerId },
      include: { product: { select: { slug: true } } },
    });

    if (memberships.length === 1) {
      redirect(`/${memberships[0].product.slug}/engineer`);
    }

    redirect("/products");
  }

  return (
    <main className="max-w-[400px] mx-auto mt-16 px-3">
      <h1 className="text-display text-black">AIRAILS</h1>
      <p className="text-body text-gray-500 mt-2 mb-4">
        AI governance for engineering teams
      </p>

      <div className="flex flex-col gap-2">
        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
        >
          <button
            type="submit"
            className="w-full bg-accent text-white hover:bg-accent-hover px-3 py-1 text-body font-medium"
          >
            Sign in with GitHub
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("gitlab");
          }}
        >
          <button
            type="submit"
            className="w-full border border-gray-200 text-black hover:bg-gray-50 px-3 py-1 text-body font-medium"
          >
            Sign in with GitLab
          </button>
        </form>
      </div>
    </main>
  );
}

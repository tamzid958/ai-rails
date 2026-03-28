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
    <div className="grain min-h-screen flex">
      {/* Left — typographic hero */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-black p-8 animate-fade-in">
        <div>
          <p className="text-label text-gray-500 tracking-[0.08em]">
            AI GOVERNANCE PLATFORM
          </p>
        </div>
        <div>
          <h1 className="text-[5.5rem] font-light leading-[0.95] tracking-[-0.04em] text-white">
            AI<br />RAILS
          </h1>
          <div className="accent-rule mt-5 mb-5" />
          <p className="text-body text-gray-400 max-w-[320px] leading-relaxed">
            Measure, govern, and optimize AI tool usage across
            your engineering organization.
          </p>
        </div>
        <p className="text-label text-gray-600 tracking-[0.08em]">
          SELF-HOSTED &middot; OPEN CORE
        </p>
      </div>

      {/* Right — sign-in form */}
      <div className="flex flex-col justify-center items-center flex-1 lg:max-w-[520px] p-8 bg-white">
        <div className="w-full max-w-[360px] animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <h1 className="text-display text-black tracking-[-0.03em]">AIRAILS</h1>
            <div className="accent-rule mt-3" />
          </div>

          <p className="text-label text-gray-500 tracking-[0.08em] mb-1">
            SIGN IN
          </p>
          <h2 className="text-h1 text-black mb-6">
            Welcome back
          </h2>

          <div className="flex flex-col gap-3 stagger">
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <button
                type="submit"
                className="group w-full flex items-center gap-3 bg-black text-white px-4 py-3 text-body font-medium hover:bg-gray-900 active:bg-gray-800"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                </svg>
                <span>Continue with GitHub</span>
                <svg className="w-4 h-4 ml-auto opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" />
                </svg>
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
                className="group w-full flex items-center gap-3 border border-gray-200 text-black px-4 py-3 text-body font-medium hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="m23.546 10.93-.033-.09-3.3-8.6a.85.85 0 0 0-.839-.516.87.87 0 0 0-.529.262.86.86 0 0 0-.264.55l-2.23 6.823H7.65L5.42 2.536a.86.86 0 0 0-.264-.55.87.87 0 0 0-.529-.262.85.85 0 0 0-.839.516l-3.3 8.6-.033.09a6.07 6.07 0 0 0 2.014 7.01l.01.008.028.02 4.98 3.727 2.462 1.863 1.5 1.132a1.01 1.01 0 0 0 1.22 0l1.5-1.132 2.462-1.863 5.008-3.748.012-.01a6.07 6.07 0 0 0 2.015-7.01Z" />
                </svg>
                <span>Continue with GitLab</span>
                <svg className="w-4 h-4 ml-auto opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </button>
            </form>
          </div>

          <p className="text-small text-gray-400 mt-6 leading-relaxed">
            By signing in you agree to the processing of your
            Git activity metadata for AI governance purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

type TopbarProps = {
  productSlug: string;
  canManageTeam: boolean;
};

export async function Topbar({ productSlug, canManageTeam }: TopbarProps) {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <header className="h-14 min-h-14 border-b border-gray-200 bg-white flex items-center justify-between px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav productSlug={productSlug} canManageTeam={canManageTeam} />
        <span className="text-body font-semibold tracking-[0.06em] text-black uppercase">
          AIRAILS
        </span>
        <span className="hidden sm:block w-px h-4 bg-gray-200" />
        <span className="hidden sm:block text-label text-gray-400 tracking-[0.08em]">
          DASHBOARD
        </span>
      </div>
      <div className="flex items-center gap-3">
        {session?.user && <UserMenu name={name} />}
      </div>
    </header>
  );
}

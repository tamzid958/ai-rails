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
    <header className="h-6 border-b border-gray-200 bg-white flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <MobileNav productSlug={productSlug} canManageTeam={canManageTeam} />
        <span className="text-h3 font-medium text-black">AIRAILS</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Product switcher slot */}
        {session?.user && <UserMenu name={name} />}
      </div>
    </header>
  );
}

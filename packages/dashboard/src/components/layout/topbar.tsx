"use client";

import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

type TopbarProps = { productSlug: string; canManageTeam: boolean; canCreateProduct?: boolean; userName: string };

export function Topbar({ productSlug, canManageTeam, canCreateProduct, userName }: TopbarProps) {
  return (
    <header className="h-14 min-h-14 border-b border-border-subtle bg-black/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav productSlug={productSlug} canManageTeam={canManageTeam} canCreateProduct={canCreateProduct} />
        <span className="lg:hidden text-sm font-bold tracking-tight text-white">AIRAILS</span>
      </div>
      <UserMenu name={userName} />
    </header>
  );
}

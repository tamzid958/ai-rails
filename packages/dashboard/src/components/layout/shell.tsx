"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type ProductItem = { name: string; slug: string; role: string };

type ShellProps = {
  children: ReactNode;
  productSlug: string;
  canManageTeam: boolean;
  canCreateProduct: boolean;
  userName: string;
  products: ProductItem[];
};

export function Shell({ children, productSlug, canManageTeam, canCreateProduct, userName, products }: ShellProps) {
  return (
    <div className="flex h-screen bg-black">
      <div className="hidden lg:flex">
        <Sidebar productSlug={productSlug} canManageTeam={canManageTeam} canCreateProduct={canCreateProduct} products={products} />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar productSlug={productSlug} canManageTeam={canManageTeam} canCreateProduct={canCreateProduct} userName={userName} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

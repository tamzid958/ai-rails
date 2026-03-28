import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type ShellProps = {
  children: ReactNode;
  productSlug: string;
  canManageTeam: boolean;
};

export function Shell({ children, productSlug, canManageTeam }: ShellProps) {
  return (
    <div className="grain flex h-screen bg-gray-50">
      <div className="hidden md:flex">
        <Sidebar productSlug={productSlug} canManageTeam={canManageTeam} />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar productSlug={productSlug} canManageTeam={canManageTeam} />
        <main className="flex-1 overflow-auto p-5 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

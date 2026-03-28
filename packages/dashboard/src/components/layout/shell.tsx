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
    <div className="flex h-screen">
      <div className="hidden md:flex">
        <Sidebar productSlug={productSlug} canManageTeam={canManageTeam} />
      </div>
      <div className="flex flex-1 flex-col">
        <Topbar productSlug={productSlug} canManageTeam={canManageTeam} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { SidebarNav } from "./sidebar";

type MobileNavProps = {
  productSlug: string;
  canManageTeam: boolean;
};

export function MobileNav({ productSlug, canManageTeam }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="text-label text-gray-600 tracking-[0.08em] px-1 py-1 hover:text-black"
        aria-label="Open navigation"
      >
        MENU
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white animate-fade-in">
          <div className="flex items-center justify-between h-14 px-5 border-b border-gray-200">
            <span className="text-body font-semibold tracking-[0.06em] text-black uppercase">
              AIRAILS
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-label text-gray-500 tracking-[0.08em] hover:text-black px-1 py-1"
              aria-label="Close navigation"
            >
              CLOSE
            </button>
          </div>
          <div className="overflow-y-auto" onClick={() => setIsOpen(false)}>
            <SidebarNav productSlug={productSlug} canManageTeam={canManageTeam} />
          </div>
        </div>
      )}
    </div>
  );
}

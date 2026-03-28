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
        className="text-small text-gray-700 px-1 py-1"
        aria-label="Open navigation"
      >
        MENU
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between h-6 px-3 border-b border-gray-200">
            <span className="text-h3 font-medium text-black">AIRAILS</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-small text-gray-500 hover:text-black px-1 py-1"
              aria-label="Close navigation"
            >
              CLOSE
            </button>
          </div>
          <div className="overflow-y-auto py-2" onClick={() => setIsOpen(false)}>
            <SidebarNav productSlug={productSlug} canManageTeam={canManageTeam} />
          </div>
        </div>
      )}
    </div>
  );
}

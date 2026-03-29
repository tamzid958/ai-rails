"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar";

type MobileNavProps = { productSlug: string; canManageTeam: boolean; canCreateProduct?: boolean };

export function MobileNav({ productSlug, canManageTeam }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1 rounded-md hover:bg-surface-raised"
        aria-label="Open navigation"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-70 bg-surface border-r border-border-subtle shadow-xl rounded-r-xl"
            >
              <div className="flex items-center justify-between h-14 px-4 border-b border-border-subtle">
                <span className="text-sm font-bold tracking-tight text-text-primary">AIRAILS</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1 rounded-md hover:bg-surface-raised"
                  aria-label="Close navigation"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="overflow-y-auto" onClick={() => setIsOpen(false)}>
                <SidebarNav productSlug={productSlug} canManageTeam={canManageTeam} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

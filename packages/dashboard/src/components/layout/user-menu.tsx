"use client";

import { signOut } from "next-auth/react";

type UserMenuProps = {
  name: string;
};

export function UserMenu({ name }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-900 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-white uppercase leading-none">
            {name.charAt(0)}
          </span>
        </div>
        <span className="hidden sm:block text-small text-gray-600">{name}</span>
      </div>
      <span className="w-px h-4 bg-gray-200" />
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-label text-gray-400 tracking-[0.08em] hover:text-black"
      >
        Sign out
      </button>
    </div>
  );
}

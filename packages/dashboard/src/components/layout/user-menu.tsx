"use client";

import { signOut } from "next-auth/react";

type UserMenuProps = {
  name: string;
};

export function UserMenu({ name }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-small text-gray-500">{name}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-small text-gray-500 hover:text-black"
      >
        Sign out
      </button>
    </div>
  );
}

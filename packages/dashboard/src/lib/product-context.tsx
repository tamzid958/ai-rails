"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

interface ProductContextValue {
  product: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: "OWNER" | "LEAD" | "MEMBER";
  };
  engineer: {
    id: string;
    name: string;
    email: string;
    gitUsername: string | null;
  };
  isOwner: boolean;
  isLead: boolean;
  isMember: boolean;
}

const ProductContext = createContext<ProductContextValue | null>(null);

export function ProductProvider({
  value,
  children,
}: {
  value: ProductContextValue;
  children: ReactNode;
}) {
  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProduct(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used within ProductProvider");
  return ctx;
}

export function useCanManageTeam(): boolean {
  const { isOwner, isLead } = useProduct();
  return isOwner || isLead;
}

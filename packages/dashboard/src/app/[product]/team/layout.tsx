"use client";

import { useProduct } from "@/lib/product-context";
import { ForbiddenPage } from "@/components/ui/forbidden-page";
import type { ReactNode } from "react";

export default function TeamLayout({ children }: { children: ReactNode }) {
  const { isMember } = useProduct();

  if (isMember) {
    return <ForbiddenPage message="Team views require LEAD or OWNER role." />;
  }

  return <>{children}</>;
}

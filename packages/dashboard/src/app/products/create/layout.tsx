import { redirect } from "next/navigation";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import type { ReactNode } from "react";

const PRODUCT_CREATION = process.env.PRODUCT_CREATION ?? "anyone";

export default async function CreateProductLayout({ children }: { children: ReactNode }) {
  if (PRODUCT_CREATION === "owners") {
    const totalProducts = await prisma.product.count();
    if (totalProducts > 0) {
      const engineer = await getEngineer();
      const isOwner = await prisma.productMembership.findFirst({
        where: { engineerId: engineer.id, role: "OWNER" },
      });
      if (!isOwner) {
        redirect("/products");
      }
    }
  }

  return <>{children}</>;
}

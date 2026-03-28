import { notFound } from "next/navigation";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { ProductProvider } from "@/lib/product-context";
import { Shell } from "@/components/layout/shell";
import { ForbiddenPage } from "@/components/ui/forbidden-page";
import type { ReactNode } from "react";

export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ product: string }>;
}) {
  const { product: productSlug } = await params;
  const engineer = await getEngineer();

  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
  });

  if (!product) {
    notFound();
  }

  const membership = await prisma.productMembership.findUnique({
    where: {
      productId_engineerId: {
        productId: product.id,
        engineerId: engineer.id,
      },
    },
  });

  if (!membership) {
    return <ForbiddenPage />;
  }

  const role = membership.role as "OWNER" | "LEAD" | "MEMBER";
  const isOwner = role === "OWNER";
  const isLead = role === "LEAD";
  const isMember = role === "MEMBER";

  return (
    <ProductProvider
      value={{
        product: { id: product.id, name: product.name, slug: product.slug },
        membership: { id: membership.id, role },
        engineer: {
          id: engineer.id,
          name: engineer.name,
          email: engineer.email,
          gitUsername: engineer.gitUsername,
        },
        isOwner,
        isLead,
        isMember,
      }}
    >
      <Shell productSlug={product.slug} canManageTeam={isOwner || isLead}>
        {children}
      </Shell>
    </ProductProvider>
  );
}

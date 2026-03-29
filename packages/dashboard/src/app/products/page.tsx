import Link from "next/link";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight, Layers } from "lucide-react";

const PRODUCT_CREATION = process.env.PRODUCT_CREATION ?? "anyone";

export default async function ProductsPage() {
  const engineer = await getEngineer();

  const memberships = await prisma.productMembership.findMany({
    where: { engineerId: engineer.id },
    include: {
      product: {
        include: { _count: { select: { repos: true, memberships: true } } },
      },
    },
  });

  const canCreate =
    PRODUCT_CREATION === "anyone" ||
    (PRODUCT_CREATION === "owners" && memberships.some((m) => m.role === "OWNER"));

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
        <PageHeader
          title="Products"
          description="Manage your AI governance products"
          actions={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/products/create">Create Product</Link>
              </Button>
            ) : undefined
          }
        />

        {memberships.length === 0 ? (
          <EmptyState
            icon={<Layers size={28} strokeWidth={1} />}
            title="No products yet"
            description={canCreate
              ? "Create a product to start tracking AI usage across your team."
              : "You haven\u2019t been added to any products yet. Ask a product owner to invite you."
            }
            action={
              canCreate ? (
                <Button asChild size="sm">
                  <Link href="/products/create">Create Product</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {memberships.map(({ product, role }) => (
              <Link
                key={product.id}
                href={`/${product.slug}/engineer`}
                className="group bg-surface-raised border border-border-subtle rounded-lg shadow-sm p-6 flex flex-col relative transition-all duration-200 hover:shadow-md hover:border-border-muted"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <p className="font-mono text-xs text-text-tertiary mt-0.5">{product.slug}</p>
                  </div>
                  <Badge variant="outline">{role}</Badge>
                </div>

                <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-tertiary">{product._count.repos} repos</span>
                    <span className="text-xs text-text-tertiary">{product._count.memberships} members</span>
                  </div>
                  <ArrowRight
                    size={16} strokeWidth={1.5}
                    className="text-text-tertiary group-hover:text-accent group-hover:translate-x-1 transition-all"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

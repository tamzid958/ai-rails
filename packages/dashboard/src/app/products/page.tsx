import Link from "next/link";
import { getEngineer } from "@/lib/auth";
import { prisma } from "@airails/shared";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProductsPage() {
  const engineer = await getEngineer();

  const memberships = await prisma.productMembership.findMany({
    where: { engineerId: engineer.id },
    include: {
      product: {
        include: {
          _count: { select: { repos: true, memberships: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-[960px] p-4">
      <PageHeader
        title="Products"
        actions={
          <Link
            href="/products/create"
            className="inline-flex items-center bg-accent px-3 py-1 text-small font-medium text-white hover:bg-accent-hover"
          >
            Create Product
          </Link>
        }
      />

      {memberships.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create a product to start tracking AI usage across your team."
          action={
            <Link
              href="/products/create"
              className="inline-flex items-center bg-accent px-3 py-1 text-small font-medium text-white hover:bg-accent-hover"
            >
              Create Product
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ product, role }) => (
            <Link
              key={product.id}
              href={`/${product.slug}/engineer`}
              className="block border border-gray-200 p-3 hover:bg-gray-50"
            >
              <h3 className="text-h3">{product.name}</h3>
              <p className="text-small text-gray-500">{product.slug}</p>
              <div className="mt-2">
                <Badge>{role}</Badge>
              </div>
              <p className="mt-2 text-small text-gray-500">
                {product._count.repos} repos · {product._count.memberships}{" "}
                members
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

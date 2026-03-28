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
    <div className="grain min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12 animate-fade-in">
        <PageHeader
          title="Products"
          actions={
            <Link
              href="/products/create"
              className="inline-flex items-center bg-accent px-3.5 py-2 text-small font-medium text-white hover:bg-accent-hover active:bg-blue-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all"
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
                className="inline-flex items-center bg-accent px-3.5 py-2 text-small font-medium text-white hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all"
              >
                Create Product
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 stagger">
            {memberships.map(({ product, role }) => (
              <Link
                key={product.id}
                href={`/${product.slug}/engineer`}
                className="group card-interactive p-5 flex flex-col relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-h3 text-black group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-small text-gray-400 font-mono mt-0.5">
                      {product.slug}
                    </p>
                  </div>
                  <Badge>{role}</Badge>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-4">
                  <span className="text-label text-gray-400 tracking-[0.08em]">
                    {product._count.repos} REPOS
                  </span>
                  <span className="text-label text-gray-400 tracking-[0.08em]">
                    {product._count.memberships} MEMBERS
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-accent absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

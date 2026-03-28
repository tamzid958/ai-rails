"use client";

import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function ProvidersPage() {
  const { product } = useProduct();

  const { data: providers, isLoading } = useQuery({
    queryKey: ["settings-providers", product.id],
    queryFn: () => api.getProviders(product.id),
  });

  return (
    <div>
      <PageHeader
        title="Providers"
        description="Available AI models filtered by this product's allowlist."
      />

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Allowed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers?.map((p) => (
                <TableRow key={p.model}>
                  <TableCell mono>{p.model}</TableCell>
                  <TableCell>{p.provider}</TableCell>
                  <TableCell>{p.allowed ? "✓" : "✗"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.status === "ACTIVE" ? "success" : "danger"}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {providers?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No providers configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

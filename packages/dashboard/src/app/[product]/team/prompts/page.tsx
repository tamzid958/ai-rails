"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type TeamPromptRow } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

function PromptExpandedRow({
  row,
  productId,
}: {
  row: TeamPromptRow;
  productId: string;
}) {
  const queryClient = useQueryClient();
  const [promoting, setPromoting] = useState<string | null>(null);

  const promoteMutation = useMutation({
    mutationFn: (overrideId: string) =>
      api.promoteOverride(productId, overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-prompts"] });
      setPromoting(null);
    },
  });

  return (
    <div className="p-3 bg-gray-50 border-t border-gray-100">
      <div className="mb-3">
        <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1">
          Base Template
        </p>
        <pre className="text-mono bg-white border border-gray-200 p-2 whitespace-pre-wrap">
          {row.baseContent}
        </pre>
      </div>

      {row.overrides.length > 0 && (
        <div>
          <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1">
            Overrides ({row.overrides.length})
          </p>
          <div className="flex flex-col gap-2">
            {row.overrides.map((o) => (
              <div
                key={o.id}
                className="border border-gray-200 bg-white p-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body font-medium">
                    {o.engineerName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-small text-gray-500 tabular-nums">
                      {o.uses} uses
                      {o.acceptRate != null && ` · ${o.acceptRate}%`}
                    </span>
                    {o.acceptRate != null &&
                      row.baseAcceptRate != null &&
                      o.acceptRate > row.baseAcceptRate && (
                        <>
                          {promoting === o.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-small text-gray-500">
                                Promote this override?
                              </span>
                              <Button
                                size="sm"
                                variant="primary"
                                loading={promoteMutation.isPending}
                                onClick={() => promoteMutation.mutate(o.id)}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPromoting(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPromoting(o.id)}
                            >
                              Promote
                            </Button>
                          )}
                        </>
                      )}
                  </div>
                </div>
                <pre className="text-mono bg-gray-50 border border-gray-100 p-2 whitespace-pre-wrap">
                  {o.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPromptsPage() {
  const { product } = useProduct();
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["team-prompts", product.id],
    queryFn: () => api.getTeamPrompts(product.id),
  });

  return (
    <div>
      <PageHeader title="Prompt Registry" />

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Type</TableHead>
                <TableHead>Base Uses</TableHead>
                <TableHead>Overrides</TableHead>
                <TableHead>Best Rate</TableHead>
                <TableHead>{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts?.map((row) => {
                const bestOverride = row.overrides.reduce<{
                  rate: number;
                  name: string;
                } | null>((best, o) => {
                  if (o.acceptRate == null) return best;
                  if (!best || o.acceptRate > best.rate)
                    return { rate: o.acceptRate, name: o.engineerName };
                  return best;
                }, null);

                const bestRate =
                  bestOverride &&
                  (row.baseAcceptRate == null ||
                    bestOverride.rate > row.baseAcceptRate)
                    ? `${bestOverride.rate}% (${bestOverride.name})`
                    : row.baseAcceptRate != null
                      ? `${row.baseAcceptRate}% (base)`
                      : "—";

                const isExpanded = expandedType === row.taskType;

                return (
                  <TableRow key={row.taskType}>
                    <TableCell>
                      <div>
                        <button
                          onClick={() =>
                            setExpandedType(isExpanded ? null : row.taskType)
                          }
                          className="text-accent hover:underline cursor-pointer"
                        >
                          {row.taskType}
                        </button>
                        {isExpanded && (
                          <PromptExpandedRow
                            row={row}
                            productId={product.id}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell mono>{row.baseUses}</TableCell>
                    <TableCell mono>{row.overrides.length}</TableCell>
                    <TableCell>{bestRate}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setExpandedType(isExpanded ? null : row.taskType)
                        }
                      >
                        {isExpanded ? "Hide" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {prompts?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No prompt templates found.
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

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function PromptsPage() {
  const { product, engineer } = useProduct();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["engineer-prompts", product.id, engineer.id],
    queryFn: () => api.getPrompts(product.id, engineer.id),
  });

  return (
    <div>
      <PageHeader
        title="Prompts"
        description={`Templates and overrides for ${product.name}`}
      />

      {isLoading ? (
        <div className="space-y-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !prompts?.length ? (
        <EmptyState
          title="No prompt templates"
          description={`No prompt templates have been created for ${product.name} yet.`}
        />
      ) : (
        <div className="border border-gray-200 mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Override?</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Accept</TableHead>
                <TableHead>Revise</TableHead>
                <TableHead>{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((p) => (
                <PromptRow
                  key={p.id}
                  prompt={p}
                  expanded={expandedId === p.id}
                  onToggle={() =>
                    setExpandedId(expandedId === p.id ? null : p.id)
                  }
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PromptRow({
  prompt,
  expanded,
  onToggle,
}: {
  prompt: {
    id: string;
    taskType: string;
    isBase: boolean;
    usageCount: number;
    acceptRate: number | null;
    reviseRate: number | null;
    content: string;
  };
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow>
        <TableCell mono>{prompt.taskType}</TableCell>
        <TableCell>
          <Badge variant={prompt.isBase ? "default" : "accent"}>
            {prompt.isBase ? "base" : "override"}
          </Badge>
        </TableCell>
        <TableCell>{prompt.isBase ? "—" : "yours"}</TableCell>
        <TableCell className="tabular-nums">{prompt.usageCount}</TableCell>
        <TableCell className="tabular-nums">
          {prompt.acceptRate !== null
            ? `${prompt.acceptRate.toFixed(1)}%`
            : "—"}
        </TableCell>
        <TableCell className="tabular-nums">
          {prompt.reviseRate !== null
            ? `${prompt.reviseRate.toFixed(1)}%`
            : "—"}
        </TableCell>
        <TableCell>
          <Button variant="secondary" size="sm" onClick={onToggle}>
            {expanded ? "Hide" : "View"}
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell className="bg-gray-50 p-3" mono={false}>
            <pre className="font-mono text-mono whitespace-pre-wrap text-gray-700">
              {prompt.content}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

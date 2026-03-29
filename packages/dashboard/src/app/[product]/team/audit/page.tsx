"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api, type AuditAction, type AuditLogRow } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { ChartCard } from "@/components/ui/chart-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FileEdit,
  ArrowUpCircle,
  Trash2,
  FileCog,
  FileText,
  Clock,
  User,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  AuditAction,
  {
    label: string;
    variant: "success" | "info" | "warning" | "purple" | "error";
    icon: typeof FilePlus;
    description: string;
  }
> = {
  CREATE_BASE: {
    label: "Created Base",
    variant: "success",
    icon: FilePlus,
    description: "New base template created",
  },
  CREATE_OVERRIDE: {
    label: "Override",
    variant: "info",
    icon: FileCog,
    description: "Engineer override created",
  },
  UPDATE: {
    label: "Updated",
    variant: "warning",
    icon: FileEdit,
    description: "Template content modified",
  },
  PROMOTE: {
    label: "Promoted",
    variant: "purple",
    icon: ArrowUpCircle,
    description: "Override promoted to base",
  },
  DELETE: {
    label: "Deleted",
    variant: "error",
    icon: Trash2,
    description: "Template removed",
  },
};

const ACTION_FILTER_OPTIONS = [
  { value: "ALL", label: "All Actions" },
  { value: "CREATE_BASE", label: "Created Base" },
  { value: "CREATE_OVERRIDE", label: "Override" },
  { value: "UPDATE", label: "Updated" },
  { value: "PROMOTE", label: "Promoted" },
  { value: "DELETE", label: "Deleted" },
];

// ── Diff Viewer ─────────────────────────────────────────────────────────────

function DiffViewer({ before, after, version }: { before: string | null; after: string; version: number }) {
  if (!before) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400">+ Initial content</span>
          <Badge variant="outline">v{version}</Badge>
        </div>
        <pre className="text-xs leading-relaxed text-text-secondary font-mono whitespace-pre-wrap m-0">
          {after}
        </pre>
      </div>
    );
  }

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-border-subtle bg-surface p-4 overflow-hidden">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-red-400">− Before</span>
          <Badge variant="outline">v{version - 1}</Badge>
        </div>
        <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap m-0">
          {beforeLines.map((line, i) => {
            const changed = afterLines[i] !== line;
            return (
              <span
                key={i}
                className={`block ${changed ? "bg-red-500/10 text-red-300" : "text-text-secondary"}`}
              >
                {line || "\u00A0"}
              </span>
            );
          })}
        </pre>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface p-4 overflow-hidden">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400">+ After</span>
          <Badge variant="outline">v{version}</Badge>
        </div>
        <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap m-0">
          {afterLines.map((line, i) => {
            const changed = beforeLines[i] !== line;
            return (
              <span
                key={i}
                className={`block ${changed ? "bg-emerald-500/10 text-emerald-300" : "text-text-secondary"}`}
              >
                {line || "\u00A0"}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ── Metadata Pills ──────────────────────────────────────────────────────────

function MetadataPills({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {Object.entries(metadata).map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-md bg-surface-raised/60 px-2.5 py-1 text-xs"
        >
          <span className="text-text-muted">{key}:</span>
          <code className="font-mono text-text-secondary">{String(value)}</code>
        </span>
      ))}
    </div>
  );
}

// ── Stat Pill ───────────────────────────────────────────────────────────────

function StatPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
        transition-all cursor-pointer border
        ${
          active
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-border-subtle bg-surface hover:bg-surface-raised text-text-muted hover:text-text-secondary"
        }
      `}
    >
      {label}
      <span
        className={`
          rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums
          ${active ? "bg-accent/20 text-accent" : "bg-surface-raised text-text-muted"}
        `}
      >
        {count}
      </span>
    </button>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PromptAuditPage() {
  const { product } = useProduct();
  const [actionFilter, setActionFilter] = useState("ALL");
  const [engineerFilter, setEngineerFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [detailRow, setDetailRow] = useState<AuditLogRow | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["prompt-audit", product.id, actionFilter, engineerFilter, page, pageSize],
    queryFn: () =>
      api.getPromptAudit(product.id, {
        ...(actionFilter !== "ALL" ? { action: actionFilter } : {}),
        ...(engineerFilter !== "ALL" ? { engineerId: engineerFilter } : {}),
        page: String(page),
        pageSize: String(pageSize),
      }),
    placeholderData: (prev) => prev,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const stats = data?.stats ?? {};
  const totalPages = Math.ceil(total / pageSize);

  // Collect unique engineers for the filter dropdown
  const engineers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      if (!seen.has(item.engineerId)) {
        seen.set(item.engineerId, item.engineerName);
      }
    }
    return Array.from(seen, ([id, name]) => ({ value: id, label: name }));
  }, [items]);

  const engineerOptions = [
    { value: "ALL", label: "All Engineers" },
    ...engineers,
  ];

  function resetFilters() {
    setActionFilter("ALL");
    setEngineerFilter("ALL");
    setPage(0);
  }

  const hasActiveFilters = actionFilter !== "ALL" || engineerFilter !== "ALL";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Prompt Audit Log"
        description="Immutable changelog of every prompt template modification"
      />

      {/* ── Action stat pills ──────────────────────────────────────────── */}
      {isLoading && !data ? (
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <StatPill
            label="All"
            count={stats["ALL"] ?? 0}
            active={actionFilter === "ALL"}
            onClick={() => { setActionFilter("ALL"); setPage(0); }}
          />
          {ACTION_FILTER_OPTIONS.slice(1).map((opt) => (
            <StatPill
              key={opt.value}
              label={opt.label}
              count={stats[opt.value] ?? 0}
              active={actionFilter === opt.value}
              onClick={() => { setActionFilter(opt.value); setPage(0); }}
            />
          ))}
        </div>
      )}

      {/* ── Main table card ────────────────────────────────────────────── */}
      <ChartCard
        title={`${total} event${total !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Select
              value={engineerFilter}
              onValueChange={(v) => { setEngineerFilter(v); setPage(0); }}
              options={engineerOptions}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            )}
          </div>
        }
      >
        {isLoading && !data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No audit events"
            description={
              hasActiveFilters
                ? "No events match your filters. Try adjusting or clearing them."
                : "Changes to prompt templates will appear here."
            }
            icon={<FileText size={32} />}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead className="text-center">Version</TableHead>
                  <TableHead className="text-right">Acceptance</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => {
                  const config = ACTION_CONFIG[row.action];
                  const Icon = config.icon;

                  return (
                    <TableRow key={row.id} className="cursor-pointer">
                      <TableCell>
                        <button
                          onClick={() => setDetailRow(row)}
                          className="inline-flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
                        >
                          <Tooltip content={config.description}>
                            <span className="inline-flex items-center gap-2">
                              <Icon size={13} className="text-text-muted shrink-0" />
                              <Badge variant={config.variant}>{config.label}</Badge>
                            </span>
                          </Tooltip>
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDetailRow(row)}
                          className="inline-flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
                        >
                          <Avatar name={row.engineerName} size="sm" />
                          <span className="text-text-secondary text-xs">
                            {row.engineerName}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDetailRow(row)}
                          className="text-text-primary text-xs font-medium cursor-pointer bg-transparent border-none p-0 text-left"
                        >
                          {row.templateName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.taskType}</Badge>
                      </TableCell>
                      <TableCell className="text-center" mono>
                        v{row.version}
                      </TableCell>
                      <TableCell className="text-right" mono>
                        {row.acceptanceRate !== null ? (
                          <span
                            className={
                              row.acceptanceRate >= 70
                                ? "text-emerald-400"
                                : row.acceptanceRate >= 50
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }
                          >
                            {row.acceptanceRate}%
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip
                          content={format(new Date(row.createdAt), "PPpp")}
                          side="left"
                        >
                          <span className="text-xs text-text-muted">
                            {formatDistanceToNow(new Date(row.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* ── Pagination ────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <span className="text-xs text-text-muted tabular-nums">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        )}
      </ChartCard>

      {/* ── Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={detailRow !== null} onOpenChange={(open) => { if (!open) setDetailRow(null); }}>
        {detailRow && (
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>
                <span className="inline-flex items-center gap-3">
                  <Badge variant={ACTION_CONFIG[detailRow.action].variant}>
                    {ACTION_CONFIG[detailRow.action].label}
                  </Badge>
                  <span className="text-text-primary">{detailRow.templateName}</span>
                </span>
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <User size={12} />
                  {detailRow.engineerName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} />
                  {format(new Date(detailRow.createdAt), "PPpp")}
                </span>
                <Badge variant="outline">{detailRow.taskType}</Badge>
                <span className="font-mono">v{detailRow.version}</span>
                {detailRow.acceptanceRate !== null && (
                  <span className="font-mono">
                    Acceptance: {detailRow.acceptanceRate}%
                  </span>
                )}
              </div>

              {/* Diff */}
              <DiffViewer
                before={detailRow.contentBefore}
                after={detailRow.contentAfter}
                version={detailRow.version}
              />

              {/* Metadata */}
              <MetadataPills metadata={detailRow.metadata} />
            </DialogBody>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

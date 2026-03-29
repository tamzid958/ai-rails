"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api, type AuditAction, type AuditLogRow } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";

const ACTION_BADGE: Record<AuditAction, { label: string; variant: "success" | "info" | "warning" | "purple" | "error" }> = {
  CREATE_BASE: { label: "Created Base", variant: "success" },
  CREATE_OVERRIDE: { label: "Created Override", variant: "info" },
  UPDATE: { label: "Updated", variant: "warning" },
  PROMOTE: { label: "Promoted", variant: "purple" },
  DELETE: { label: "Deleted", variant: "error" },
};

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Actions" },
  { value: "CREATE_BASE", label: "Created Base" },
  { value: "CREATE_OVERRIDE", label: "Created Override" },
  { value: "UPDATE", label: "Updated" },
  { value: "PROMOTE", label: "Promoted" },
  { value: "DELETE", label: "Deleted" },
];

function DiffView({ before, after }: { before: string | null; after: string }) {
  if (!before) {
    return (
      <div style={{ padding: "12px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Initial content</p>
        <pre style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>{after}</pre>
      </div>
    );
  }

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ padding: "12px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>Before (v{"{prev}"})</p>
        <pre style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
          {beforeLines.map((line, i) => {
            const changed = afterLines[i] !== line;
            return (
              <span key={i} style={changed ? { background: "rgba(239,68,68,0.12)", display: "block" } : { display: "block" }}>
                {line}
              </span>
            );
          })}
        </pre>
      </div>
      <div style={{ padding: "12px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 6 }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>After</p>
        <pre style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
          {afterLines.map((line, i) => {
            const changed = beforeLines[i] !== line;
            return (
              <span key={i} style={changed ? { background: "rgba(52,211,153,0.12)", display: "block" } : { display: "block" }}>
                {line}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export default function PromptAuditPage() {
  const { product } = useProduct();
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["prompt-audit", product.id, actionFilter, cursor],
    queryFn: () =>
      api.getPromptAudit(product.id, {
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(cursor ? { cursor } : {}),
      }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Prompt Audit"
        description="Immutable changelog of all prompt template modifications"
      />

      <ChartCard
        title="Audit Log"
        action={
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCursor(undefined); }}
            style={{
              fontSize: 12,
              padding: "5px 10px",
              background: "var(--color-surface)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 6,
              outline: "none",
            }}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">{""}</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead className="text-center">Version</TableHead>
                  <TableHead className="text-right">Acceptance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row: AuditLogRow) => {
                  const badge = ACTION_BADGE[row.action];
                  const isExpanded = expandedId === row.id;

                  return (
                    <TableRow key={row.id}>
                      <TableCell colSpan={8} style={{ padding: 0 }}>
                        <div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : row.id)}
                            className="w-full text-left cursor-pointer hover:bg-surface-raised/50 transition-colors"
                            style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr 1fr 1fr 80px 100px", alignItems: "center", padding: "10px 16px", gap: 8 }}
                          >
                            <span className="text-text-muted">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                              {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{row.engineerName}</span>
                            <span><Badge variant={badge.variant}>{badge.label}</Badge></span>
                            <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{row.templateName}</span>
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{row.taskType}</span>
                            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>v{row.version}</span>
                            <span style={{ fontSize: 12, textAlign: "right", color: row.acceptanceRate !== null ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>
                              {row.acceptanceRate !== null ? `${row.acceptanceRate}%` : "—"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div style={{ padding: "0 16px 16px 48px" }}>
                              <DiffView before={row.contentBefore} after={row.contentAfter} />
                              {row.metadata && Object.keys(row.metadata).length > 0 && (
                                <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-muted)" }}>
                                  {Object.entries(row.metadata).map(([k, v]) => (
                                    <span key={k} style={{ marginRight: 16 }}>{k}: <code style={{ fontFamily: "var(--font-mono)" }}>{String(v)}</code></span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-text-tertiary py-12">
                      No audit events yet. Changes to prompt templates will appear here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {(data?.cursor || cursor) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border-subtle)" }}>
                {cursor && (
                  <button
                    onClick={() => setCursor(undefined)}
                    style={{ fontSize: 12, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    ← Back to latest
                  </button>
                )}
                {data?.cursor && (
                  <button
                    onClick={() => setCursor(data.cursor!)}
                    style={{ fontSize: 12, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}
                  >
                    Load older →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </ChartCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

const WEBHOOK_VARIANT = {
  CONNECTED: "success",
  STALE: "warning",
  PENDING: "default",
} as const;

export default function WebhooksPage() {
  const { product } = useProduct();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["settings-webhooks", product.id],
    queryFn: () => api.getWebhookStatus(product.id),
  });

  function copyText(field: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const githubUrl = data?.webhookUrl?.github ?? "";
  const gitlabUrl = data?.webhookUrl?.gitlab ?? "";

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Webhooks" description="Configure webhooks to receive PR events from your repositories" />

      {isLoading ? <Skeleton className="h-48" /> : (
        <>
          {/* Webhook URLs */}
          <div className="bg-surface-raised rounded-lg border border-border-subtle p-6 space-y-5">
            <div>
              <p className="text-xs text-text-muted mb-2">GitHub Webhook URL</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs text-text-secondary flex-1 break-all bg-surface rounded-md px-3 py-2">{githubUrl}</code>
                <Button size="sm" variant="ghost" onClick={() => copyText("github", githubUrl)}>
                  {copiedField === "github" ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-2">GitLab Webhook URL</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs text-text-secondary flex-1 break-all bg-surface rounded-md px-3 py-2">{gitlabUrl}</code>
                <Button size="sm" variant="ghost" onClick={() => copyText("gitlab", gitlabUrl)}>
                  {copiedField === "gitlab" ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
                </Button>
              </div>
            </div>

            {/* Webhook Secret */}
            {data?.webhookSecret && (
              <div>
                <p className="text-xs text-text-muted mb-2">Webhook Secret</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs text-text-secondary flex-1 break-all bg-surface rounded-md px-3 py-2">
                    {showSecret ? data.webhookSecret : "••••••••••••••••••••••••••••••••"}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copyText("secret", data.webhookSecret!)}>
                    {copiedField === "secret" ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-2">This secret is unique to {product.name}. Use it as the webhook secret in your repository settings.</p>
              </div>
            )}
          </div>

          {/* Repo Status */}
          <ChartCard title="Repository Status" action={data?.repos.length ? <span className="text-xs text-text-muted tabular-nums">{data.repos.length} repos</span> : undefined}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.repos.map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell mono>{repo.fullName}</TableCell>
                    <TableCell>{repo.provider}</TableCell>
                    <TableCell>
                      <Badge variant={WEBHOOK_VARIANT[repo.webhookStatus]}>{repo.webhookStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      {repo.lastEventAt ? formatDistanceToNow(new Date(repo.lastEventAt), { addSuffix: true }) : "No events yet"}
                    </TableCell>
                  </TableRow>
                ))}
                {data?.repos.length === 0 && (
                  <TableRow><TableCell className="text-center text-text-tertiary py-8">No repositories linked. Add repos in Settings → Repositories.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ChartCard>
        </>
      )}
    </div>
  );
}

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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const WEBHOOK_VARIANT = {
  CONNECTED: "success",
  STALE: "warning",
  PENDING: "default",
} as const;

export default function WebhooksPage() {
  const { product } = useProduct();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["settings-webhooks", product.id],
    queryFn: () => api.getWebhookStatus(product.id),
  });

  function handleCopy() {
    if (data?.webhookUrl) {
      navigator.clipboard.writeText(data.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <PageHeader title="Webhooks" />

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <>
          <div className="border border-gray-200 p-3 mb-4">
            <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1">
              Webhook URL
            </p>
            <div className="flex items-center gap-2">
              <code className="text-mono flex-1 break-all">
                {data?.webhookUrl}
              </code>
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 bg-gray-50 p-3 mb-4">
            <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-2">
              Setup Instructions
            </p>
            <p className="text-body text-gray-600">
              Configure this URL as a webhook for each repository. Required
              events:{" "}
              <code className="text-mono">push</code>,{" "}
              <code className="text-mono">pull_request</code>,{" "}
              <code className="text-mono">pull_request_review</code>
            </p>
          </div>

          <div className="border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.repos.map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell mono>{repo.fullName}</TableCell>
                    <TableCell>
                      <Badge variant={WEBHOOK_VARIANT[repo.webhookStatus]}>
                        {repo.webhookStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {repo.lastEventAt
                        ? formatDistanceToNow(new Date(repo.lastEventAt), {
                            addSuffix: true,
                          })
                        : "No events received"}
                    </TableCell>
                  </TableRow>
                ))}
                {data?.repos.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="text-center text-gray-500 py-4"
                      mono={false}
                    >
                      No repositories linked. Add repos first.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

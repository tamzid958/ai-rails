"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { useProduct } from "@/lib/product-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/ui/chart-card";
import { ForbiddenPage } from "@/components/ui/forbidden-page";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, GitBranch } from "lucide-react";

export default function SettingsReposPage() {
  const { product, isMember } = useProduct();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [provider, setProvider] = useState("github");
  const [nameError, setNameError] = useState("");
  const [addError, setAddError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const { data: repos, isLoading } = useQuery({
    queryKey: ["settings-repos", product.id],
    queryFn: () => api.getSettingsRepos(product.id),
    enabled: !isMember,
  });

  const addMutation = useMutation({
    mutationFn: () => api.addRepo(product.id, fullName.trim(), provider),
    onSuccess: () => {
      setFullName("");
      setProvider("github");
      setNameError("");
      setAddError("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["settings-repos"] });
    },
    onError: (err: Error) => setAddError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeRepo(id),
    onSuccess: () => {
      setRemoveId(null);
      queryClient.invalidateQueries({ queryKey: ["settings-repos"] });
    },
  });

  if (isMember) return <ForbiddenPage message="Repository management requires LEAD or OWNER role." />;

  function handleAdd() {
    if (!fullName.trim()) { setNameError("Repository name is required"); return; }
    if (!fullName.includes("/")) { setNameError("Must be in org/repo format"); return; }
    setNameError("");
    setAddError("");
    addMutation.mutate();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Repositories"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} strokeWidth={1.5} /> Add Repository
          </Button>
        }
      />

      <ChartCard
        title="Linked Repositories"
        action={repos?.length ? <span className="text-xs text-text-muted tabular-nums">{repos.length} total</span> : undefined}
      >
        {isLoading ? <Skeleton className="h-48" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repo</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Webhook</TableHead>
                <TableHead>Last Event</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>{""}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos?.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell mono>{repo.fullName}</TableCell>
                  <TableCell>{repo.provider}</TableCell>
                  <TableCell>
                    <Badge variant={repo.webhookActive ? "success" : "default"}>
                      {repo.webhookActive ? "ACTIVE" : "PENDING"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {repo.lastEventAt ? (
                      <Tooltip content={format(new Date(repo.lastEventAt), "PPpp")}>
                        <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(repo.lastEventAt), { addSuffix: true })}</span>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip content={format(new Date(repo.createdAt), "PPpp")}>
                      <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(repo.createdAt), { addSuffix: true })}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setRemoveId(repo.id)} className="text-danger">Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
              {repos?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState title="No repositories" description="Link a repository to start tracking AI activity." icon={<GitBranch size={32} />} compact />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </ChartCard>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Add Repository</DialogTitle>
            <DialogDescription>Link a repository to track AI activity.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Input label="Repository" value={fullName} onChange={(e) => setFullName(e.target.value)} error={nameError} placeholder="org/repo-name" />
            <Select label="Provider" value={provider} onValueChange={setProvider} options={[{ value: "github", label: "GitHub" }, { value: "gitlab", label: "GitLab" }]} />
            {addError && <p className="text-xs text-danger">{addError}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>Add Repository</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeId !== null}
        title="Remove Repository"
        description="Removing this repository will stop tracking new events. Historical data will be preserved."
        confirmLabel="Remove"
        variant="danger"
        loading={removeMutation.isPending}
        onConfirm={() => removeId && removeMutation.mutate(removeId)}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}

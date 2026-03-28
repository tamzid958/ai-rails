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
import { ForbiddenPage } from "@/components/ui/forbidden-page";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function SettingsReposPage() {
  const { product, isMember } = useProduct();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["settings-repos"] });
    },
    onError: (err: Error) => {
      setAddError(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeRepo(id),
    onSuccess: () => {
      setRemoveId(null);
      queryClient.invalidateQueries({ queryKey: ["settings-repos"] });
    },
  });

  if (isMember) {
    return <ForbiddenPage message="Repository management requires LEAD or OWNER role." />;
  }

  function handleAdd() {
    if (!fullName.trim()) {
      setNameError("Repository name is required");
      return;
    }
    if (!fullName.includes("/")) {
      setNameError("Must be in org/repo format");
      return;
    }
    setNameError("");
    setAddError("");
    addMutation.mutate();
  }

  return (
    <div>
      <PageHeader title="Repositories" />

      <div className="mb-4">
        <div className="flex items-end gap-2">
          <Input
            label="Repository"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={nameError}
            placeholder="org/repo-name"
            className="w-60"
          />
          <Select
            label="Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            options={[
              { value: "github", label: "GitHub" },
              { value: "gitlab", label: "GitLab" },
            ]}
            className="w-36"
          />
          <Button onClick={handleAdd} loading={addMutation.isPending}>
            Add Repository
          </Button>
        </div>
        {addError && (
          <p className="text-small text-danger mt-1">{addError}</p>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-50" />
      ) : (
        <div className="border border-gray-200">
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
                    <Badge
                      variant={repo.webhookActive ? "success" : "default"}
                    >
                      {repo.webhookActive ? "ACTIVE" : "PENDING"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {repo.lastEventAt
                      ? formatDistanceToNow(new Date(repo.lastEventAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(repo.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRemoveId(repo.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {repos?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No repositories linked. Add one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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

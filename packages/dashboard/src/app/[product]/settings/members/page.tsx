"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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

const ROLE_VARIANT = {
  OWNER: "accent",
  LEAD: "success",
  MEMBER: "default",
} as const;

export default function MembersPage() {
  const { product, isOwner, isMember } = useProduct();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [emailError, setEmailError] = useState("");
  const [addError, setAddError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["settings-members", product.id],
    queryFn: () => api.getMembers(product.id),
    enabled: !isMember,
  });

  const addMutation = useMutation({
    mutationFn: () => api.addMember(product.id, email.trim(), role),
    onSuccess: () => {
      setEmail("");
      setRole("MEMBER");
      setEmailError("");
      setAddError("");
      queryClient.invalidateQueries({ queryKey: ["settings-members"] });
    },
    onError: (err: Error) => {
      setAddError(err.message);
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ membershipId, newRole }: { membershipId: string; newRole: string }) =>
      api.updateMemberRole(membershipId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-members"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeMember(id),
    onSuccess: () => {
      setRemoveId(null);
      queryClient.invalidateQueries({ queryKey: ["settings-members"] });
    },
  });

  if (isMember) {
    return <ForbiddenPage message="Member management requires LEAD or OWNER role." />;
  }

  function handleAdd() {
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!email.includes("@")) {
      setEmailError("Invalid email");
      return;
    }
    setEmailError("");
    setAddError("");
    addMutation.mutate();
  }

  const roleOptions = isOwner
    ? [
        { value: "MEMBER", label: "MEMBER" },
        { value: "LEAD", label: "LEAD" },
        { value: "OWNER", label: "OWNER" },
      ]
    : [
        { value: "MEMBER", label: "MEMBER" },
        { value: "LEAD", label: "LEAD" },
      ];

  return (
    <div>
      <PageHeader title="Members" />

      <div className="mb-4">
        <div className="flex items-end gap-2">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            placeholder="engineer@company.com"
            className="w-60"
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roleOptions}
            className="w-36"
          />
          <Button onClick={handleAdd} loading={addMutation.isPending}>
            Add Member
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Git Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isOwner && <TableHead>{""}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell mono>{m.email}</TableCell>
                  <TableCell mono>
                    {m.gitUsername ?? (
                      <span className="text-warning text-small">
                        No git username — commits won&apos;t be tracked
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          roleMutation.mutate({
                            membershipId: m.id,
                            newRole: e.target.value,
                          })
                        }
                        className="border border-gray-200 px-2 py-1 text-small bg-white"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="LEAD">LEAD</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                    ) : (
                      <Badge variant={ROLE_VARIANT[m.role]}>
                        {m.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(m.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRemoveId(m.id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {members?.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-center text-gray-500 py-4"
                    mono={false}
                  >
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={removeId !== null}
        title="Remove Member"
        description="This member will lose access to this product. Their historical data will be preserved."
        confirmLabel="Remove"
        variant="danger"
        loading={removeMutation.isPending}
        onConfirm={() => removeId && removeMutation.mutate(removeId)}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, MoreHorizontal, Shield, Trash2, Users, UserPlus, Clock } from "lucide-react";

const ROLE_VARIANT = { OWNER: "info", LEAD: "success", MEMBER: "default" } as const;

export default function MembersPage() {
  const { product, isOwner, isMember } = useProduct();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [emailError, setEmailError] = useState("");
  const [addError, setAddError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ membershipId: string; name: string; currentRole: string } | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["settings-members", product.id],
    queryFn: () => api.getMembers(product.id),
    enabled: !isMember,
  });

  const addMutation = useMutation({
    mutationFn: () => api.addMember(product.id, email.trim(), role),
    onSuccess: () => { setEmail(""); setRole("MEMBER"); setEmailError(""); setAddError(""); setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["settings-members"] }); },
    onError: (err: Error) => setAddError(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ membershipId, newRole }: { membershipId: string; newRole: string }) => api.updateMemberRole(membershipId, newRole),
    onSuccess: () => { setRoleChangeTarget(null); queryClient.invalidateQueries({ queryKey: ["settings-members"] }); },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeMember(id),
    onSuccess: () => { setRemoveId(null); queryClient.invalidateQueries({ queryKey: ["settings-members"] }); },
  });

  type PendingUser = { id: string; name: string; email: string; createdAt: string };

  const { data: pending } = useQuery<PendingUser[]>({
    queryKey: ["settings-members-pending", product.id],
    queryFn: async () => {
      const res = await fetch(`/api/settings/members/pending?productId=${product.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isMember,
  });

  const quickAddMutation = useMutation({
    mutationFn: (pendingEmail: string) => api.addMember(product.id, pendingEmail, "MEMBER"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-members"] });
      queryClient.invalidateQueries({ queryKey: ["settings-members-pending"] });
    },
  });

  if (isMember) return <ForbiddenPage message="Member management requires LEAD or OWNER role." />;

  function handleAdd() {
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!email.includes("@")) { setEmailError("Invalid email"); return; }
    setEmailError(""); setAddError(""); addMutation.mutate();
  }

  const roleOptions = isOwner
    ? [{ value: "MEMBER", label: "Member" }, { value: "LEAD", label: "Lead" }, { value: "OWNER", label: "Owner" }]
    : [{ value: "MEMBER", label: "Member" }, { value: "LEAD", label: "Lead" }];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Members"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} strokeWidth={1.5} /> Add Member
          </Button>
        }
      />

      <ChartCard
        title="Team Members"
        action={members?.length ? <span className="text-xs text-text-muted tabular-nums">{members.length} total</span> : undefined}
      >
        {isLoading ? <Skeleton className="h-48" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Git Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isOwner && <TableHead className="w-12">{""}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={m.name} size="sm" />
                      <span className="text-text-secondary text-xs">{m.name}</span>
                    </span>
                  </TableCell>
                  <TableCell mono>{m.email}</TableCell>
                  <TableCell mono>
                    {m.gitUsername ?? <span className="text-warning text-xs">No git username</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[m.role]}>{m.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={format(new Date(m.createdAt), "PPpp")} side="left">
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </span>
                    </Tooltip>
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer">
                            <MoreHorizontal size={14} strokeWidth={1.5} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setRoleChangeTarget({ membershipId: m.id, name: m.name, currentRole: m.role }); setSelectedNewRole(m.role); }}>
                            <Shield size={14} strokeWidth={1.5} />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setRemoveId(m.id)} className="text-danger!">
                            <Trash2 size={14} strokeWidth={1.5} />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {members?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isOwner ? 6 : 5}>
                    <EmptyState title="No members" description="Add engineers to this product." icon={<Users size={32} />} compact />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </ChartCard>

      {/* Pending Users */}
      {pending && pending.length > 0 && (
        <ChartCard
          title="Pending Users"
          description="Signed in but not added to any product yet"
          action={<span className="text-xs text-warning tabular-nums">{pending.length} waiting</span>}
        >
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-md border border-border-subtle">
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-warning shrink-0" />
                  <div>
                    <p className="text-sm text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-tertiary font-mono">{p.email}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => quickAddMutation.mutate(p.email)}
                  disabled={quickAddMutation.isPending}
                >
                  <UserPlus size={12} className="mr-1" /> Add
                </Button>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Invite an engineer to this product.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} placeholder="engineer@company.com" />
            <Select label="Role" value={role} onValueChange={setRole} options={roleOptions} />
            {addError && <p className="text-xs text-danger">{addError}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleChangeTarget !== null} onOpenChange={(open) => { if (!open) setRoleChangeTarget(null); }}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              {roleChangeTarget ? `Update ${roleChangeTarget.name}'s role. This will change their permissions immediately.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Select
              label="New Role"
              value={selectedNewRole}
              onValueChange={setSelectedNewRole}
              options={roleOptions}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setRoleChangeTarget(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!roleChangeTarget || selectedNewRole === roleChangeTarget.currentRole}
              loading={roleMutation.isPending}
              onClick={() => roleChangeTarget && roleMutation.mutate({ membershipId: roleChangeTarget.membershipId, newRole: selectedNewRole })}
            >
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
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

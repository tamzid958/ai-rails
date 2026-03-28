"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type ProductSettings } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ForbiddenPage } from "@/components/ui/forbidden-page";
import { Check, X } from "lucide-react";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-text-secondary mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-2">{hint}</p>}
    </div>
  );
}

function ProductForm({ initial }: { initial: ProductSettings }) {
  const { product } = useProduct();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [allowedModels, setAllowedModels] = useState<string[]>(initial.allowedModels);
  const [defaultModel, setDefaultModel] = useState(initial.defaultModel ?? "");

  const { data: providers } = useQuery({
    queryKey: ["settings-providers", product.id],
    queryFn: () => api.getProviders(product.id),
  });
  const availableModels = providers?.map((p: { model: string }) => p.model) ?? [];
  const [costAlertDaily, setCostAlertDaily] = useState(initial.costAlertDaily != null ? String(initial.costAlertDaily) : "");
  const [costAlertEngineer, setCostAlertEngineer] = useState(initial.costAlertEngineer != null ? String(initial.costAlertEngineer) : "");
  const [saved, setSaved] = useState(false);

  const inputClass = "w-full h-10 px-3 text-sm bg-surface text-text-primary border border-border-muted rounded-md outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all";

  const updateMutation = useMutation({
    mutationFn: () => {
      return api.updateProduct(product.id, {
        name,
        description: description || null,
        allowedModels: allowedModels,
        defaultModel: defaultModel || null,
        costAlertDaily: costAlertDaily ? parseFloat(costAlertDaily) : null,
        costAlertEngineer: costAlertEngineer ? parseFloat(costAlertEngineer) : null,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["settings-product"] });
    },
  });

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

        {/* General */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 24 }}>General</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Product Name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Slug" hint="Cannot be changed after creation">
              <div style={{ height: 40, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 14, color: "var(--color-text-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: 6, fontFamily: "var(--font-mono)" }}>
                {initial.slug}
              </div>
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this product track?"
                style={{ width: "100%", padding: "10px 12px", fontSize: 14, color: "var(--color-text-primary)", background: "var(--color-surface)", border: "1px solid var(--color-border-muted)", borderRadius: 6, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
            </Field>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border-subtle)" }} />

        {/* Models */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>AI Models</h3>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 24 }}>Control which models engineers can use</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Allowed Models" hint="Select models engineers can use. Leave empty to allow all.">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: allowedModels.length > 0 ? 10 : 0 }}>
                {allowedModels.map((m) => (
                  <span key={m} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: 12, background: "var(--color-surface)", border: "1px solid var(--color-border-muted)", borderRadius: 4, color: "var(--color-text-secondary)" }}>
                    {m}
                    <button onClick={() => setAllowedModels((prev) => prev.filter((x) => x !== m))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--color-text-muted)" }}>
                      <X size={10} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {availableModels.filter((m) => !allowedModels.includes(m)).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAllowedModels((prev) => [...prev, m])}
                    style={{ padding: "3px 10px", fontSize: 12, background: "none", border: "1px dashed var(--color-border-subtle)", borderRadius: 4, color: "var(--color-text-muted)", cursor: "pointer" }}
                  >
                    + {m}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Default Model">
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                style={{ width: "100%", height: 40, padding: "0 12px", fontSize: 14, background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-muted)", borderRadius: 6, outline: "none", cursor: "pointer" }}
              >
                <option value="">None (use provider default)</option>
                {(allowedModels.length > 0 ? allowedModels : availableModels).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border-subtle)" }} />

        {/* Cost Alerts */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>Cost Alerts</h3>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 24 }}>Get notified when spending exceeds thresholds</p>
          <div style={{ display: "flex", gap: 16 }}>
            <Field label="Daily Threshold (USD)">
              <input type="number" value={costAlertDaily} onChange={(e) => setCostAlertDaily(e.target.value)} placeholder="50.00" className={inputClass} />
            </Field>
            <Field label="Per Engineer / Day (USD)">
              <input type="number" value={costAlertEngineer} onChange={(e) => setCostAlertEngineer(e.target.value)} placeholder="10.00" className={inputClass} />
            </Field>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border-subtle)" }} />

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <Check size={12} strokeWidth={2} /> Saved
            </span>
          )}
          <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductSettingsPage() {
  const { product, isOwner } = useProduct();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings-product", product.id],
    queryFn: () => api.getProductSettings(product.id),
    enabled: isOwner,
  });

  if (!isOwner) return <ForbiddenPage message="Product settings require OWNER role." />;

  if (isLoading || !settings) {
    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader title="Product Settings" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Product Settings" />
      <ProductForm initial={settings} />
    </div>
  );
}

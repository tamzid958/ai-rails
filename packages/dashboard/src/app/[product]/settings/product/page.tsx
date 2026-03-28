"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProduct } from "@/lib/product-context";
import { api, type ProductSettings } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ForbiddenPage } from "@/components/ui/forbidden-page";

function ProductForm({ initial }: { initial: ProductSettings }) {
  const { product } = useProduct();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [allowedModels, setAllowedModels] = useState(
    initial.allowedModels.join(", "),
  );
  const [defaultModel, setDefaultModel] = useState(initial.defaultModel ?? "");
  const [costAlertDaily, setCostAlertDaily] = useState(
    initial.costAlertDaily != null ? String(initial.costAlertDaily) : "",
  );
  const [costAlertEngineer, setCostAlertEngineer] = useState(
    initial.costAlertEngineer != null
      ? String(initial.costAlertEngineer)
      : "",
  );
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => {
      const models = allowedModels
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      return api.updateProduct(product.id, {
        name,
        description: description || null,
        allowedModels: models,
        defaultModel: defaultModel || null,
        costAlertDaily: costAlertDaily ? parseFloat(costAlertDaily) : null,
        costAlertEngineer: costAlertEngineer
          ? parseFloat(costAlertEngineer)
          : null,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ["settings-product"] });
    },
  });

  return (
    <div className="max-w-lg flex flex-col gap-4">
      <Input
        label="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <label className="text-label uppercase text-gray-500 tracking-[0.06em]">
          Slug
        </label>
        <input
          value={initial.slug}
          disabled
          className="w-full p-2 text-body bg-gray-50 text-gray-500 border border-gray-200 cursor-not-allowed"
        />
        <p className="text-small text-gray-400">
          Slug cannot be changed after creation.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label uppercase text-gray-500 tracking-[0.06em]">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full p-2 text-body bg-white text-black border border-gray-200 outline-none focus:border-2 focus:border-accent"
        />
      </div>

      <Input
        label="Allowed Models"
        value={allowedModels}
        onChange={(e) => setAllowedModels(e.target.value)}
        placeholder="gpt-4o, claude-sonnet (empty = all)"
      />

      <Input
        label="Default Model"
        value={defaultModel}
        onChange={(e) => setDefaultModel(e.target.value)}
        placeholder="gpt-4o"
      />

      <Input
        label="Cost Alert — Daily Threshold (USD)"
        type="number"
        value={costAlertDaily}
        onChange={(e) => setCostAlertDaily(e.target.value)}
        placeholder="50.00"
      />

      <Input
        label="Cost Alert — Per Engineer Daily (USD)"
        type="number"
        value={costAlertEngineer}
        onChange={(e) => setCostAlertEngineer(e.target.value)}
        placeholder="10.00"
      />

      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span className="text-small text-success">Changes saved</span>
        )}
        <Button
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
        >
          Save Changes
        </Button>
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

  if (!isOwner) {
    return <ForbiddenPage message="Product settings require OWNER role." />;
  }

  if (isLoading || !settings) {
    return (
      <div>
        <PageHeader title="Product Settings" />
        <Skeleton className="h-75" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Product Settings" />
      <ProductForm initial={settings} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Failed to create product (${res.status})`);
        setSubmitting(false);
        return;
      }

      const data = (await res.json()) as { slug: string };
      router.push(`/${data.slug}/engineer`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 lg:py-12 animate-fade-in">
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to products
          </Link>
        </div>

        <PageHeader
          title="Create Product"
          description="A product is an isolation boundary for AI governance. Each product has its own team, repos, API keys, and analytics."
        />

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <Input
            label="Product Name"
            placeholder="e.g. Payments API"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            startIcon={<Layers size={16} />}
            autoFocus
          />

          <Input
            label="Slug"
            placeholder="e.g. payments-api"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          <p className="text-xs text-text-tertiary -mt-3">
            Used in URLs and CLI commands. Lowercase, hyphens only.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">
              Description
              <span className="text-text-tertiary font-normal"> (optional)</span>
            </label>
            <textarea
              className="w-full h-20 px-3 py-2 text-sm bg-surface text-text-primary rounded-md border border-border-muted placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              placeholder="What does this product/team do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-danger border border-danger/20 bg-danger-tint px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting} loading={submitting}>
              {submitting ? "Creating..." : "Create Product"}
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/products">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

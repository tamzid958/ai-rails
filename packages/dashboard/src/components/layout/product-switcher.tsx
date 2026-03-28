"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

type ProductItem = {
  slug: string;
  name: string;
  role: string;
};

type ProductSwitcherProps = {
  products: ProductItem[];
  currentSlug: string;
};

function ProductSwitcher({ products, currentSlug }: ProductSwitcherProps) {
  const router = useRouter();
  const current = products.find((p) => p.slug === currentSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-[14px] font-medium text-text-primary cursor-pointer outline-none">
          {current?.name ?? currentSlug}
          <ChevronDown size={14} className="text-text-tertiary" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {products.map((p) => (
          <DropdownMenuItem
            key={p.slug}
            onClick={() => router.push(`/${p.slug}/engineer`)}
            className={p.slug === currentSlug ? "bg-surface-raised!" : ""}
          >
            <span className="flex-1">{p.name}</span>
            <Badge variant="outline">{p.role}</Badge>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/products/create" className="flex items-center gap-2">
            <Plus size={14} strokeWidth={1.5} />
            Create Product
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProductSwitcher };
export type { ProductSwitcherProps, ProductItem };

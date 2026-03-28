"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const current = products.find((p) => p.slug === currentSlug);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(slug: string) {
    setOpen(false);
    router.push(`/${slug}/engineer`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-small font-medium text-black"
      >
        {current?.name ?? currentSlug} ▾
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 min-w-[200px] border border-gray-200 bg-white">
          {products.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => handleSelect(p.slug)}
              className={`flex w-full items-center gap-2 px-3 py-1 text-left text-small hover:bg-gray-50 ${
                p.slug === currentSlug ? "border-l-2 border-accent" : ""
              }`}
            >
              <span className="text-black">{p.name}</span>
              <span className="text-label text-gray-500 uppercase">
                {p.role}
              </span>
            </button>
          ))}

          <div className="border-t border-gray-100">
            <Link
              href="/products/create"
              className="block px-3 py-1 text-small text-accent hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Create Product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export { ProductSwitcher };
export type { ProductSwitcherProps, ProductItem };

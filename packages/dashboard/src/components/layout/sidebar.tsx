"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";
import {
  BarChart3, Activity, FileText, Target, Users, GitBranch, DollarSign,
  AlertTriangle, CheckCircle, Key, Layers, Webhook, Shield, ChevronLeft, Zap,
  ChevronDown, Settings, Plus,
} from "lucide-react";
import { Tooltip } from "../ui/tooltip";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

type NavSection = {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  items: NavItem[];
};

type ProductItem = { name: string; slug: string; role: string };
type SidebarProps = { productSlug: string; canManageTeam: boolean; products?: ProductItem[] };

function buildSections(productSlug: string, canManageTeam: boolean): NavSection[] {
  const base = `/${productSlug}`;
  const sections: NavSection[] = [
    {
      title: "Engineer",
      icon: BarChart3,
      items: [
        { label: "Overview", href: `${base}/engineer`, icon: BarChart3 },
        { label: "Usage", href: `${base}/engineer/usage`, icon: Activity },
        { label: "Prompts", href: `${base}/engineer/prompts`, icon: FileText },
        { label: "Effectiveness", href: `${base}/engineer/effectiveness`, icon: Target },
      ],
    },
  ];

  if (canManageTeam) {
    sections.push({
      title: "Team",
      icon: Users,
      items: [
        { label: "Overview", href: `${base}/team`, icon: Users },
        { label: "Engineers", href: `${base}/team/engineers`, icon: Zap },
        { label: "Prompts", href: `${base}/team/prompts`, icon: FileText },
        { label: "Drift", href: `${base}/team/drift`, icon: AlertTriangle },
        { label: "Costs", href: `${base}/team/costs`, icon: DollarSign },
        { label: "Outcomes", href: `${base}/team/outcomes`, icon: CheckCircle },
      ],
    });
  }

  sections.push({
    title: "Settings",
    icon: Settings,
    items: [
      { label: "Product", href: `${base}/settings/product`, icon: Layers },
      { label: "Repositories", href: `${base}/settings/repos`, icon: GitBranch },
      { label: "Members", href: `${base}/settings/members`, icon: Users },
      { label: "API Keys", href: `${base}/settings/api-keys`, icon: Key },
      { label: "Providers", href: `${base}/settings/providers`, icon: Shield },
      { label: "Webhooks", href: `${base}/settings/webhooks`, icon: Webhook },
    ],
  });

  return sections;
}

function CollapsibleSection({ section, collapsed, open, onToggle }: { section: NavSection; collapsed: boolean; open: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const hasActiveChild = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  const SectionIcon = section.icon;

  if (collapsed) {
    const firstItem = section.items[0];
    return (
      <Tooltip content={section.title} side="right">
        <Link
          href={firstItem.href}
          className={clsx(
            "flex items-center justify-center py-2.5 rounded-md transition-colors",
            hasActiveChild
              ? "bg-accent/10 text-accent"
              : "text-text-tertiary hover:text-text-primary hover:bg-surface-raised",
          )}
        >
          <SectionIcon size={18} strokeWidth={1.5} />
        </Link>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={clsx(
          "w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-md border-none bg-transparent cursor-pointer transition-colors",
          hasActiveChild
            ? "text-text-primary font-medium"
            : "text-text-tertiary hover:text-text-primary",
        )}
      >
        <SectionIcon size={16} strokeWidth={1.5} />
        <span className="flex-1 text-left">{section.title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={14} strokeWidth={1.5} className="text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-0.5 border-l border-border-subtle pl-3 flex flex-col gap-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "block py-1.5 px-2 text-[13px] rounded-md transition-colors",
                      isActive
                        ? "text-accent bg-accent/10 font-medium"
                        : "text-text-tertiary hover:text-text-primary hover:bg-surface-raised",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarNav({ productSlug, canManageTeam, collapsed = false }: SidebarProps & { collapsed?: boolean }) {
  const pathname = usePathname();
  const sections = buildSections(productSlug, canManageTeam);

  const activeSection = sections.findIndex((s) =>
    s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  );
  const [openIndex, setOpenIndex] = useState(activeSection >= 0 ? activeSection : 0);
  const [lastActive, setLastActive] = useState(activeSection);

  if (activeSection !== lastActive && activeSection >= 0) {
    setLastActive(activeSection);
    setOpenIndex(activeSection);
  }

  return (
    <nav className="flex flex-col gap-1 py-4 px-3">
      {sections.map((section, i) => (
        <CollapsibleSection
          key={section.title}
          section={section}
          collapsed={collapsed}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
        />
      ))}
    </nav>
  );
}

function ProductSwitcher({ products, currentSlug, collapsed }: { products: ProductItem[]; currentSlug: string; collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const current = products.find((p) => p.slug === currentSlug);

  if (collapsed) {
    return (
      <Tooltip content={current?.name ?? currentSlug} side="right">
        <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center text-accent text-xs font-medium cursor-default">
          {(current?.name ?? currentSlug).charAt(0).toUpperCase()}
        </div>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 py-1.5 px-1 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center text-accent text-xs font-medium shrink-0">
          {(current?.name ?? currentSlug).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-text-primary truncate">{current?.name ?? currentSlug}</p>
          <p className="text-[10px] text-text-muted">{current?.role}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} strokeWidth={1.5} className="text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 flex flex-col gap-px">
              {products.filter((p) => p.slug !== currentSlug).map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}/engineer`}
                  className="flex items-center gap-2.5 py-1.5 px-1 rounded-md no-underline transition-colors hover:bg-surface-raised"
                >
                  <div className="w-7 h-7 rounded-md bg-surface-raised flex items-center justify-center text-text-secondary text-xs font-medium shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-secondary truncate">{p.name}</p>
                    <p className="text-[10px] text-text-muted">{p.role}</p>
                  </div>
                </Link>
              ))}
              <Link
                href="/products/create"
                className="flex items-center gap-2.5 py-1.5 px-1 rounded-md no-underline text-text-muted transition-colors hover:bg-surface-raised hover:text-text-secondary"
              >
                <div className="w-7 h-7 rounded-md border border-dashed border-border-subtle flex items-center justify-center shrink-0">
                  <Plus size={12} strokeWidth={1.5} />
                </div>
                <span className="text-[13px]">New product</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getStoredCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sidebar-collapsed") === "true";
}

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function Sidebar({ productSlug, canManageTeam, products = [] }: SidebarProps) {
  const collapsed = useSyncExternalStore(subscribeStorage, getStoredCollapsed, () => false);

  function toggleCollapse() {
    const next = !collapsed;
    localStorage.setItem("sidebar-collapsed", String(next));
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-0 bg-black border-r border-border-subtle overflow-y-auto overflow-x-hidden flex flex-col"
    >
      {/* Brand + collapse */}
      <div className="px-4 py-4 border-b border-white/6 flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.18em" }} className="text-text-primary">
          {collapsed ? "AR" : "AIRAILS"}
        </span>
        <button
          onClick={toggleCollapse}
          className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1 rounded-md hover:bg-white/5"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft size={14} strokeWidth={1.5} />
          </motion.div>
        </button>
      </div>

      <SidebarNav productSlug={productSlug} canManageTeam={canManageTeam} collapsed={collapsed} />

      {/* Bottom: product switcher */}
      <div className="mt-auto border-t border-white/6">
        {products.length > 0 && (
          <div className="p-3">
            <ProductSwitcher products={products} currentSlug={productSlug} collapsed={collapsed} />
          </div>
        )}
      </div>
    </motion.aside>
  );
}

"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

type NavItem = {
  label: string;
  href: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarProps = {
  productSlug: string;
  canManageTeam: boolean;
};

function buildSections(productSlug: string, canManageTeam: boolean): NavSection[] {
  const base = `/${productSlug}`;

  const sections: NavSection[] = [
    {
      title: "ENGINEER",
      items: [
        { label: "Overview", href: `${base}/engineer` },
        { label: "Usage", href: `${base}/engineer/usage` },
        { label: "Prompts", href: `${base}/engineer/prompts` },
        { label: "Effectiveness", href: `${base}/engineer/effectiveness` },
      ],
    },
  ];

  if (canManageTeam) {
    sections.push({
      title: "TEAM",
      items: [
        { label: "Overview", href: `${base}/team` },
        { label: "Engineers", href: `${base}/team/engineers` },
        { label: "Prompts", href: `${base}/team/prompts` },
        { label: "Drift", href: `${base}/team/drift` },
        { label: "Costs", href: `${base}/team/costs` },
        { label: "Outcomes", href: `${base}/team/outcomes` },
        { label: "Repos", href: `${base}/team/repos` },
      ],
    });
  }

  sections.push({
    title: "SETTINGS",
    items: [
      { label: "API Keys", href: `${base}/settings/api-keys` },
      { label: "Repos", href: `${base}/settings/repos` },
      { label: "Members", href: `${base}/settings/members` },
      { label: "Product", href: `${base}/settings/product` },
      { label: "Providers", href: `${base}/settings/providers` },
      { label: "Webhooks", href: `${base}/settings/webhooks` },
    ],
  });

  return sections;
}

export function SidebarNav({
  productSlug,
  canManageTeam,
}: SidebarProps) {
  const pathname = usePathname();
  const sections = buildSections(productSlug, canManageTeam);

  return (
    <nav className="flex flex-col gap-0 py-4 px-3">
      {sections.map((section, idx) => (
        <div key={section.title} className={idx > 0 ? "mt-5" : ""}>
          <p className="text-label uppercase text-gray-400 tracking-[0.08em] mb-2 px-2 select-none">
            {section.title}
          </p>
          <div className="flex flex-col gap-px">
            {section.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block text-small py-1.5 px-2 transition-colors",
                    isActive
                      ? "border-l-2 border-accent text-black font-medium bg-accent-light"
                      : "border-l-2 border-transparent text-gray-500 hover:text-black hover:bg-gray-50",
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ productSlug, canManageTeam }: SidebarProps) {
  return (
    <aside className="w-58 min-w-58 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      <div className="h-14 min-h-14 flex items-center px-5 border-b border-gray-200">
        <span className="text-body font-semibold tracking-[0.06em] text-black uppercase">
          AIRAILS
        </span>
      </div>
      <SidebarNav productSlug={productSlug} canManageTeam={canManageTeam} />
    </aside>
  );
}

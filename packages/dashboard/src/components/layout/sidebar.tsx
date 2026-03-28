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
    <nav className="flex flex-col gap-0 py-2 px-2">
      {sections.map((section, idx) => (
        <div key={section.title}>
          {idx > 0 && <hr className="border-t border-gray-100 my-2" />}
          <p className="text-label uppercase text-gray-500 tracking-[0.06em] mb-1 px-2">
            {section.title}
          </p>
          {section.items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={clsx(
                  "block text-small py-1 px-2",
                  isActive
                    ? "border-l-2 border-accent text-black font-medium"
                    : "text-gray-500 hover:text-black",
                )}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ productSlug, canManageTeam }: SidebarProps) {
  return (
    <aside className="w-[220px] min-w-[220px] bg-white border-r border-gray-200 overflow-y-auto">
      <SidebarNav productSlug={productSlug} canManageTeam={canManageTeam} />
    </aside>
  );
}

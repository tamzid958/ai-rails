import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductSwitcher } from "@/components/layout/product-switcher";
import type { ProductItem } from "@/components/layout/product-switcher";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Radix dropdown so it renders content synchronously in jsdom
vi.mock("@/components/ui/dropdown-menu", () => {
  const Trigger = ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: unknown }) => (
    <div data-testid="dropdown-trigger" {...props}>{children}</div>
  );
  const Content = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-content" {...props}>{children}</div>
  );
  const Item = ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; asChild?: boolean; [key: string]: unknown }) => (
    <div role="menuitem" onClick={onClick} {...props}>{children}</div>
  );
  const Separator = () => <hr />;
  const Menu = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return {
    DropdownMenu: Menu,
    DropdownMenuTrigger: Trigger,
    DropdownMenuContent: Content,
    DropdownMenuItem: Item,
    DropdownMenuSeparator: Separator,
  };
});

// Mock Badge to render children directly
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const products: ProductItem[] = [
  { slug: "alpha", name: "Alpha", role: "OWNER" },
  { slug: "beta", name: "Beta", role: "MEMBER" },
  { slug: "gamma", name: "Gamma", role: "LEAD" },
];

beforeEach(() => {
  mockPush.mockClear();
});

describe("ProductSwitcher", () => {
  it("should_show_all_products_user_belongs_to", () => {
    render(<ProductSwitcher products={products} currentSlug="alpha" />);

    // "Alpha" appears in both the trigger and the dropdown item
    expect(screen.getAllByText("Alpha").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("should_show_role_for_each_product", () => {
    render(<ProductSwitcher products={products} currentSlug="alpha" />);

    expect(screen.getByText("OWNER")).toBeInTheDocument();
    expect(screen.getByText("MEMBER")).toBeInTheDocument();
    expect(screen.getByText("LEAD")).toBeInTheDocument();
  });

  it("should_navigate_to_product_on_select", () => {
    render(<ProductSwitcher products={products} currentSlug="alpha" />);

    const betaItem = screen.getByText("Beta").closest("[role='menuitem']");
    fireEvent.click(betaItem!);

    expect(mockPush).toHaveBeenCalledWith("/beta/engineer");
  });
});

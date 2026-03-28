import { describe, it, expect, vi } from "vitest";
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

const products: ProductItem[] = [
  { slug: "alpha", name: "Alpha", role: "OWNER" },
  { slug: "beta", name: "Beta", role: "MEMBER" },
  { slug: "gamma", name: "Gamma", role: "LEAD" },
];

describe("ProductSwitcher", () => {
  it("should_show_all_products_user_belongs_to", () => {
    render(<ProductSwitcher products={products} currentSlug="alpha" />);

    // Open dropdown
    fireEvent.click(screen.getByText(/Alpha/));

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("should_show_role_for_each_product", () => {
    render(<ProductSwitcher products={products} currentSlug="alpha" />);
    fireEvent.click(screen.getByText(/Alpha/));

    expect(screen.getByText("OWNER")).toBeInTheDocument();
    expect(screen.getByText("MEMBER")).toBeInTheDocument();
    expect(screen.getByText("LEAD")).toBeInTheDocument();
  });

  it("should_navigate_to_product_on_select", () => {
    render(<ProductSwitcher products={products} currentSlug="alpha" />);
    fireEvent.click(screen.getByText(/Alpha/));
    fireEvent.click(screen.getByText("Beta"));

    expect(mockPush).toHaveBeenCalledWith("/beta/engineer");
  });
});

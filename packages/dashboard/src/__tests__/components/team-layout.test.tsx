import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamLayout from "@/app/[product]/team/layout";

// Mock the product context
const mockUseProduct = vi.fn();
vi.mock("@/lib/product-context", () => ({
  useProduct: () => mockUseProduct(),
}));

describe("TeamLayout role gating", () => {
  it("should_render_for_LEAD_role", () => {
    mockUseProduct.mockReturnValue({
      product: { id: "1", name: "Test", slug: "test" },
      membership: { id: "m1", role: "LEAD" },
      engineer: { id: "e1", name: "Dev", email: "dev@test.com", gitUsername: null },
      isOwner: false,
      isLead: true,
      isMember: false,
    });

    render(
      <TeamLayout>
        <div>Team Content</div>
      </TeamLayout>,
    );

    expect(screen.getByText("Team Content")).toBeInTheDocument();
  });

  it("should_render_for_OWNER_role", () => {
    mockUseProduct.mockReturnValue({
      product: { id: "1", name: "Test", slug: "test" },
      membership: { id: "m1", role: "OWNER" },
      engineer: { id: "e1", name: "Dev", email: "dev@test.com", gitUsername: null },
      isOwner: true,
      isLead: false,
      isMember: false,
    });

    render(
      <TeamLayout>
        <div>Team Content</div>
      </TeamLayout>,
    );

    expect(screen.getByText("Team Content")).toBeInTheDocument();
  });

  it("should_show_403_for_MEMBER_role", () => {
    mockUseProduct.mockReturnValue({
      product: { id: "1", name: "Test", slug: "test" },
      membership: { id: "m1", role: "MEMBER" },
      engineer: { id: "e1", name: "Dev", email: "dev@test.com", gitUsername: null },
      isOwner: false,
      isLead: false,
      isMember: true,
    });

    render(
      <TeamLayout>
        <div>Team Content</div>
      </TeamLayout>,
    );

    expect(screen.queryByText("Team Content")).not.toBeInTheDocument();
    // Should show the forbidden page
    expect(screen.getByText(/LEAD or OWNER/i)).toBeInTheDocument();
  });
});

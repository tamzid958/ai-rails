import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarNav } from "@/components/layout/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/test-product/engineer",
}));

describe("Sidebar", () => {
  it("should_hide_TEAM_section_for_MEMBER", () => {
    render(
      <SidebarNav productSlug="test-product" canManageTeam={false} />,
    );

    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.getByText("My Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should_show_TEAM_section_for_LEAD", () => {
    render(
      <SidebarNav productSlug="test-product" canManageTeam={true} />,
    );

    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("My Dashboard")).toBeInTheDocument();
  });

  it("should_highlight_active_nav_item", () => {
    render(
      <SidebarNav productSlug="test-product" canManageTeam={false} />,
    );

    const overviewLink = screen.getByText("Overview");
    expect(overviewLink.closest("a")).toHaveClass("text-accent");
  });
});

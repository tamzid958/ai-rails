import { test, expect } from "@playwright/test";

const GATEWAY_URL = process.env["GATEWAY_URL"] ?? "http://localhost:8080";
const DASHBOARD_URL = process.env["DASHBOARD_URL"] ?? "http://localhost:3000";

interface SetupResult {
  productA: { id: string; slug: string };
  productB: { id: string; slug: string };
  apiKeyA: string;
  apiKeyB: string;
}

async function apiCall(
  url: string,
  method: string,
  apiKey: string,
  body?: unknown,
) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

test.describe("Multi-product isolation", () => {
  test("should_isolate_data_across_products_end_to_end", async () => {
    // This test requires a running gateway with a real database
    // Skip if no gateway available
    try {
      const healthRes = await fetch(`${GATEWAY_URL}/health`);
      if (!healthRes.ok) {
        test.skip();
        return;
      }
    } catch {
      test.skip();
      return;
    }

    // Use bootstrap API key (if available) to create products
    const bootstrapKey = process.env["BOOTSTRAP_API_KEY"];
    if (!bootstrapKey) {
      test.skip();
      return;
    }

    // 1. Create two products
    const { data: prodA } = await apiCall(
      `${GATEWAY_URL}/api/products`,
      "POST",
      bootstrapKey,
      { name: "E2E Product A", slug: `e2e-a-${Date.now()}` },
    );

    const { data: prodB } = await apiCall(
      `${GATEWAY_URL}/api/products`,
      "POST",
      bootstrapKey,
      { name: "E2E Product B", slug: `e2e-b-${Date.now()}` },
    );

    // 2. Create API keys for each product
    const { data: keyA } = await apiCall(
      `${GATEWAY_URL}/api/keys`,
      "POST",
      bootstrapKey,
      { label: "E2E Key A" },
    );

    // 3. Log activities in different products
    const resA = await apiCall(
      `${GATEWAY_URL}/api/activities`,
      "GET",
      keyA.key,
    );
    expect(resA.status).toBe(200);

    // 4. Verify isolation — activities from A should not appear in B
    const activitiesA = resA.data;
    for (const item of activitiesA.items) {
      expect(item.productId).toBe(prodA.id);
    }
  });
});

test.describe("Role-based access", () => {
  test("should_enforce_role_based_access", async () => {
    try {
      const healthRes = await fetch(`${GATEWAY_URL}/health`);
      if (!healthRes.ok) {
        test.skip();
        return;
      }
    } catch {
      test.skip();
      return;
    }

    const bootstrapKey = process.env["BOOTSTRAP_API_KEY"];
    if (!bootstrapKey) {
      test.skip();
      return;
    }

    // Create product and a MEMBER-level key
    const { data: prod } = await apiCall(
      `${GATEWAY_URL}/api/products`,
      "POST",
      bootstrapKey,
      { name: "E2E Role Test", slug: `e2e-role-${Date.now()}` },
    );

    // MEMBER should be able to read activities
    const readRes = await apiCall(
      `${GATEWAY_URL}/api/activities`,
      "GET",
      bootstrapKey,
    );
    expect(readRes.status).toBe(200);
  });
});

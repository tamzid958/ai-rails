import { getActiveProduct } from "./product-context.js";
import { getApiKey } from "./credentials.js";

export class GatewayClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async del(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }
  }
}

export function createClient(): GatewayClient {
  const product = getActiveProduct();
  const apiKey = getApiKey();
  return new GatewayClient(product.gatewayUrl, apiKey);
}

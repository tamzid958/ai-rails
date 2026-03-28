import { readConfig } from "./config.js";

export interface ActiveProduct {
  slug: string;
  gatewayUrl: string;
}

export function getActiveProduct(): ActiveProduct {
  const config = readConfig();
  if (!config.product?.slug) {
    throw new Error(
      'No product configured. Run `airails init --product <slug>` or `airails products switch <slug>`',
    );
  }
  return {
    slug: config.product.slug,
    gatewayUrl: config.gateway?.url ?? "http://localhost:8080",
  };
}

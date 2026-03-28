# API Reference

All endpoints require authentication via `Authorization: Bearer ar_k1_...` header. Every response is scoped to the product associated with the API key.

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Service health check |

## Products

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Any | List products the caller belongs to |
| POST | `/api/products` | Any | Create a new product (caller becomes OWNER) |
| PATCH | `/api/products/:slug` | OWNER | Update product settings |

## Members

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/products/:slug/members` | Any | List product members |
| POST | `/api/products/:slug/members` | LEAD/OWNER | Invite a member |
| PATCH | `/api/products/:slug/members/:id` | OWNER | Change member role |
| DELETE | `/api/products/:slug/members/:id` | OWNER | Remove a member |

## Repositories

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/products/:slug/repos` | Any | List linked repositories |
| POST | `/api/products/:slug/repos` | LEAD/OWNER | Link a repository |
| DELETE | `/api/products/:slug/repos/:id` | OWNER | Unlink a repository |

## API Keys

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/keys` | Any | List caller's API keys |
| POST | `/api/keys` | Any | Create a new API key |
| DELETE | `/api/keys/:id` | Any | Revoke an API key |

## Activities

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/activities` | Any | List AI activities (product-scoped) |

## Prompts

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/prompts` | Any | List prompt templates |
| POST | `/api/prompts` | Any* | Create a template (* base templates require LEAD/OWNER) |
| POST | `/api/prompts/:id/promote` | LEAD/OWNER | Promote override to base |

## Costs

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/costs` | Any | Cost breakdown (product-scoped) |

## PR Events

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/prs` | Any | List PR events (product-scoped) |

## Effectiveness

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/effectiveness` | Any | Effectiveness scores |
| GET | `/api/effectiveness/comparison` | Any | Tool comparison |
| GET | `/api/effectiveness/leaderboard` | Any | Tool leaderboard |

## Recommendations

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/recommendations` | Any | List recommendations |
| POST | `/api/recommendations/:id/dismiss` | Any | Dismiss a recommendation |

## LLM Proxy

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/v1/chat/completions` | Any | Proxied LLM call (logged + enriched) |

## Rate Limits

- **Per API key:** 100 requests/minute
- **Per product:** 1000 requests/minute

Rate limit headers are included on every response.

## Product Scoping

Every data-returning endpoint filters by `productId` derived from the authenticated API key. There is no way to query across products with a single key.

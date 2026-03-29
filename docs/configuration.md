---
layout: default
title: "Configuration Reference"
---

# Configuration Reference

## Environment Variables

See `.env.example` for all available variables.

### Core

| Variable | Required | Description |
|----------|----------|-------------|
| `AIRAILS_SECRET` | Yes | Secret for API key hashing |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AUTH_SECRET` | Yes | NextAuth session secret |
| `LITELLM_MASTER_KEY` | Yes | LiteLLM admin key |
| `LOG_LEVEL` | No | Logging level (default: `info`) |
| `AIRAILS_PORT` | No | Gateway port (default: `8080`) |
| `WEBHOOK_PORT` | No | Webhook port (default: `8081`) |
| `CORS_ORIGIN` | No | Comma-separated allowed origins (default: `http://localhost:3000`) |

### OAuth Providers

Configure one or more — only providers with credentials appear on the login page.

| Variable | Provider | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub | OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub | OAuth App client secret |
| `GITLAB_CLIENT_ID` | GitLab | OAuth Application ID |
| `GITLAB_CLIENT_SECRET` | GitLab | OAuth Application secret |
| `GOOGLE_CLIENT_ID` | Google | Google Cloud OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google | Google Cloud OAuth 2.0 client secret |
| `MICROSOFT_CLIENT_ID` | Microsoft | Azure AD / Entra ID app client ID |
| `MICROSOFT_CLIENT_SECRET` | Microsoft | Azure AD / Entra ID app client secret |
| `MICROSOFT_TENANT_ID` | Microsoft | Tenant ID (default: `common` for multi-tenant) |

### Access Control

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOWED_EMAIL_DOMAINS` | No | Comma-separated domain allowlist (e.g. `company.com,contractor.io`). Empty = allow all. |
| `INVITE_ONLY` | No | `true` = users must be pre-added to a product before accessing the dashboard. Default: `false` (dev), `true` (prod). |
| `PRODUCT_CREATION` | No | Who can create products: `anyone` or `owners`. Default: `anyone` (dev), `owners` (prod). |

## `.airails/config.yml`

The CLI creates this file in your repository root:

```yaml
product:
  slug: payments-api          # Links this repo to a product

gateway:
  url: http://localhost:8080   # Gateway URL for API calls

sync:
  tools:                       # Tools to generate configs for
    - claude                   # → CLAUDE.md
    - cursor                   # → .cursorrules
    - copilot                  # → copilot-instructions.md
```

## Connection Pooling (Production)

In production, append pooling parameters to `DATABASE_URL`:

```
DATABASE_URL=postgresql://user:pass@host:5432/airails?connection_limit=20&pool_timeout=10
```

The production Docker Compose overlay (`docker-compose.prod.yml`) includes these by default.

## Model Management

Models are managed from the dashboard at **Settings → Providers**. OWNER and LEAD roles can:

- **Add models** — search from 60+ pre-configured LiteLLM models (OpenAI, Anthropic, Google, Mistral, Ollama, Groq, etc.) or enter a custom model ID
- **Block/enable models** — per-product allowlist. Blocked models return 403 at the gateway.
- **Custom endpoints** — for Azure OpenAI, self-hosted models, or private deployments, set a custom API key and base URL per model

Models are added to LiteLLM at runtime via its management API — no config file edits or restarts needed.

The `litellm/config.yaml` file is only used for initial bootstrap. After first deployment, manage models from the dashboard.

## AI Policy Rules

Configure per-product governance rules in **Product Settings**:

| Setting | Type | Effect |
|---------|------|--------|
| `spendCapDaily` | Hard limit | Blocks gateway requests when engineer exceeds daily spend |
| `spendCapMonthly` | Hard limit | Blocks gateway requests when engineer exceeds monthly spend |
| `costAlertDaily` | Soft alert | Generates recommendation + webhook notification |
| `costAlertEngineer` | Soft alert | Per-engineer alert threshold |
| `allowedModels` | Allowlist | Only listed models can be used (empty = all allowed) |
| `alertWebhookUrl` | Webhook | URL to POST recommendation alerts to (Slack, Teams, etc.) |

## Rate Limits

The gateway enforces two rate limit layers:

| Layer | Limit | Scope |
|-------|-------|-------|
| Per API key | 100 req/min | Individual engineer per product |
| Per product | 1000 req/min | Aggregate across all keys |

Rate limit headers are returned on every response:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

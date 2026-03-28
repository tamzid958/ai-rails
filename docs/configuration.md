# Configuration Reference

## Environment Variables

See `.env.example` for all available variables.

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

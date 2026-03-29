---
layout: default
title: "Setup Guide"
---

# Setup Guide

## Prerequisites

- Docker and Docker Compose v2
- Node.js 22+ (for development)
- Git

## Production Deploy

The interactive deploy script handles everything — environment setup, secrets, building, migrations, and startup:

```bash
git clone https://github.com/tamzid958/ai-rails.git
cd ai-rails
chmod +x deploy.sh
./deploy.sh
```

The script walks you through 7 steps:

1. **Prerequisites** — checks Docker, Docker Compose v2, and OpenSSL
2. **Environment** — prompts for domain, database URL, secrets (auto-generated), OAuth, and access control
3. **Validation** — ensures required vars aren't empty or placeholders
4. **Build** — builds all Docker images in parallel
5. **Migrations** — runs `prisma migrate deploy`
6. **Start** — launches services and waits for health checks
7. **Summary** — prints status table with URLs

Re-running on an existing deployment is safe — it backs up `.env` before reconfiguring.

## Local Development

```bash
cp .env.example .env
# Edit .env — set AIRAILS_SECRET, AUTH_SECRET, and provider API keys

docker compose up -d

# Verify services
curl http://localhost:8080/health   # gateway
curl http://localhost:8081/health   # webhook
curl http://localhost:3000           # dashboard
```

## Authentication Setup

AIRails supports four OAuth providers. Configure whichever your company uses — only providers with credentials set will appear on the login page.

| Provider | Env Vars | Notes |
|----------|----------|-------|
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Auto-links git username |
| GitLab | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET` | Auto-links git username |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Workspace / personal |
| Microsoft | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Azure AD / Entra ID |

### Access Control

Restrict who can access your instance:

```bash
# Only allow company email domains (comma-separated)
ALLOWED_EMAIL_DOMAINS=company.com,contractor.io

# Require users to be pre-added to a product before they can access
INVITE_ONLY=true
```

When `INVITE_ONLY=true`, authenticated users without a product membership see a "Waiting for invitation" page. A team lead must add them to a product first.

Set `PRODUCT_CREATION=owners` to restrict product creation to existing product owners only. The first user on a fresh instance can always create the first product.

## Creating Your First Product

1. Open the dashboard at `http://localhost:3000`
2. Sign in with your configured OAuth provider — first user on a fresh instance becomes the initial owner
3. Click "Create Product" (e.g., "Payments API")
4. Add your repositories in Settings → Repos
5. Add models in Settings → Providers (search from 60+ LiteLLM-supported models)
6. Invite team members in Settings → Members — each member gets an auto-generated API key

## CLI Setup

```bash
# Install the CLI (published to GitHub Packages)
npm install -g @tamzid958/airails --registry https://npm.pkg.github.com

# Initialize in your repo
cd your-project
airails init

# Follow the interactive prompts to:
# - Create or select a product
# - Link the current repository
# - Generate config files
```

## Manual Production Deployment

If you prefer not to use `deploy.sh`, use the production Docker Compose overlay directly:

```bash
cp .env.example .env
# Edit .env with production values

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This adds resource limits, sets `NODE_ENV=production`, and configures structured logging. See [configuration.md](configuration.md) for details.

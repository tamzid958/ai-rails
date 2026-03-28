# Setup Guide

## Prerequisites

- Docker and Docker Compose v2
- Node.js 22+ (for development)
- Git

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/tamzid958/ai-rails.git
cd ai-rails

# 2. Configure environment
cp .env.example .env
# Edit .env — set AIRAILS_SECRET, AUTH_SECRET, and provider API keys

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec gateway npx prisma migrate deploy

# 5. Verify services
curl http://localhost:8080/health   # gateway
curl http://localhost:8081/health   # webhook
curl http://localhost:3000           # dashboard
```

## Creating Your First Product

1. Open the dashboard at `http://localhost:3000`
2. Sign in with GitHub or GitLab OAuth
3. Create a product (e.g., "Payments API")
4. Add your repositories to the product
5. Invite team members

## CLI Setup

```bash
# Install the CLI
npm install -g @airails/cli

# Initialize in your repo
cd your-project
airails init

# Follow the interactive prompts to:
# - Create or select a product
# - Link the current repository
# - Generate config files
```

## Production Deployment

Use the production Docker Compose overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This adds resource limits, sets `NODE_ENV=production`, and configures connection pooling. See [configuration.md](configuration.md) for details.

---
layout: default
title: "Contributing"
---

# Contributing

## Development Setup

```bash
# Prerequisites: Node.js 22+, Docker

# Clone and install
git clone https://github.com/tamzid958/ai-rails.git
cd ai-rails
npm install

# Start infrastructure
docker compose up postgres redis -d

# Set up database
cp .env.example .env
npx prisma migrate dev

# Run all services in dev mode
npm run dev
```

## Project Structure

```
airails/
├── packages/
│   ├── shared/        # Shared types, schemas, DB client
│   ├── gateway/       # API proxy (Fastify)
│   ├── webhook/       # Git event receiver (Fastify)
│   ├── dashboard/     # Web UI (Next.js)
│   └── cli/           # Engineer CLI (Commander.js)
├── prisma/            # Schema & migrations
├── test/              # Shared test helpers
├── docs/              # Documentation
└── docker-compose.yml
```

## Code Standards

- TypeScript strict mode
- ESLint with zero warnings
- Functional patterns preferred
- Early returns over deep nesting
- Files under 300 lines
- Descriptive names: `getUserById` not `queryDB`

## Testing

- **Unit tests:** `npx turbo test:unit`
- **Integration tests:** `npx turbo test:integration` (requires Postgres + Redis)
- Coverage threshold: 75% (statements, functions, lines), 70% (branches)
- Test names: `should_return_404_when_user_not_found`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure all checks pass: `npx turbo lint typecheck test:unit`
4. Open a PR with a clear description
5. Address review feedback

## Commit Conventions

Use conventional commit prefixes:

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring
- `test:` — test additions/changes
- `docs:` — documentation
- `chore:` — maintenance tasks

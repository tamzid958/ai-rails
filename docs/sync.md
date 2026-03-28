---
layout: default
title: "Config Sync Engine"
---

# Config Sync Engine

## Overview

The config sync engine generates native AI tool configuration files from a single `.airails/` source of truth. This ensures all engineers on a product use the same prompts and conventions, regardless of which AI tool they prefer.

## How It Works

```
.airails/prompts/code-review.md     →  CLAUDE.md (Claude Code)
.airails/prompts/test-gen.md        →  .cursorrules (Cursor)
.airails/overrides/alice/...        →  copilot-instructions.md (Copilot)
```

Run `airails sync` to generate configs:

```bash
airails sync
# ✓ Generated CLAUDE.md
# ✓ Generated .cursorrules
# ✓ Generated copilot-instructions.md
```

## Configuration

In `.airails/config.yml`:

```yaml
sync:
  tools:
    - claude      # generates CLAUDE.md
    - cursor      # generates .cursorrules
    - copilot     # generates copilot-instructions.md
```

## Prompt Templates

Base templates are shared across the team:

```
.airails/prompts/
├── code-review.md
├── test-gen.md
├── docs.md
└── commit-message.md
```

## Engineer Overrides

Individual engineers can override base templates:

```
.airails/overrides/
└── alice/
    └── code-review.md    # Alice's custom code review prompt
```

Overrides take priority over base templates for that engineer.

## Auto-Sync on Commit

Install the git hook to auto-sync before each commit:

```bash
airails hooks install
```

This ensures generated configs are always up-to-date.

## Drift Detection

The dashboard tracks "prompt drift" — how much each engineer's overrides differ from the base templates. High drift may indicate the base template needs updating.

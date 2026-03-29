---
layout: default
title: "Config Sync, Drift & Audit"
---

# Config Sync, Drift & Audit

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

## Config Drift

The **Config Drift** page (Team > Drift) monitors configuration alignment across every engineer on a product. It evaluates three dimensions per engineer over a rolling 30-day window and assigns a composite drift score.

### Drift Dimensions

**1. Model Drift** (weight: 3 per violation)

If the product has an `allowedModels` list, the system checks each engineer's recent AI activity for models not on the list. Each non-allowed model adds 3 points to the drift score.

Example: product allows `claude-sonnet-4-5` and `gpt-4o`, but an engineer used `claude-opus-4` — that model appears as a drift issue.

If `allowedModels` is empty (no restrictions), model drift is skipped.

**2. Template Drift** (weight: 2 per stale override)

Compares each engineer's prompt overrides against the current base templates:

- **Stale override** — the base template was updated after the override was last edited. The engineer is working with an outdated fork.
- **Orphaned override** — the override's task type no longer has a base template (it was removed).

Each stale or orphaned override adds 2 points.

**3. Tool Sync** (weight: 1)

Checks capture method diversity:

| Gateway | Tagging | Status |
|---------|---------|--------|
| Yes | Yes | Full coverage — no drift |
| Yes | No | OK — gateway provides cost/token data |
| No | Yes | +1 drift — missing cost and token metrics |
| No | No | No recent activity (noted but not scored) |

### Drift Score

The composite score maps to a severity level:

| Score | Level | Meaning |
|-------|-------|---------|
| 0 | **NONE** | Fully aligned |
| 1-2 | **LOW** | Minor issues (e.g., partial capture only) |
| 3-4 | **MEDIUM** | Stale overrides or a non-allowed model |
| 5+ | **HIGH** | Multiple violations — needs attention |

Engineers are sorted HIGH-first in the dashboard table.

### Dashboard Columns

| Column | Description |
|--------|-------------|
| **Engineer** | Team member name |
| **Drift** | Severity badge (NONE / LOW / MEDIUM / HIGH) |
| **Models** | Count of non-allowed models used, or "OK" |
| **Templates** | Count of stale overrides, or override ratio (e.g., 2/5) |
| **Gateway** | Icon showing gateway active/inactive |
| **Last Sync** | Time since the last `airails sync` event |
| **Details** | Expandable — lists every drift reason as human-readable text |

### API

```
GET /api/team/drift?productId=<id>
```

Returns an array of engineer drift rows. Requires LEAD or OWNER role.

### Resolving Drift

- **Model drift** — engineer should switch to an allowed model, or a lead should update the product's allowed models list in Settings.
- **Stale overrides** — engineer should re-run `airails sync` or update their override in the dashboard to incorporate base template changes.
- **No gateway data** — configure the gateway proxy so AI tool requests are captured with full token/cost data.

## Prompt Audit

The **Prompt Audit** page (Team > Audit) provides an immutable changelog of every prompt template modification. It answers: *who changed what, when, and how did it affect code quality?*

### Tracked Actions

| Action | Trigger | What's Recorded |
|--------|---------|-----------------|
| `CREATE_BASE` | Lead creates a new base template | Initial content |
| `CREATE_OVERRIDE` | Engineer creates a personal override | Content + linked base template ID |
| `UPDATE` | Engineer edits their override | Content before and after |
| `PROMOTE` | Lead promotes an override to base | Base content before, override content after, source engineer |
| `DELETE` | Template removed | Final content snapshot |

### Dashboard Features

- **Timeline table** — every audit event with timestamp, engineer, action badge, template name, task type, and version number.
- **Expandable diff view** — click any row to see a side-by-side before/after comparison with changed lines highlighted.
- **Action filter** — narrow the log to specific action types (e.g., only promotions).
- **Acceptance rate** — each row shows the template's current acceptance rate, so you can correlate changes with outcomes.
- **Cursor pagination** — load older entries without performance issues.

### API

```
GET /api/team/audit?productId=<id>
```

Optional query parameters:

| Param | Description |
|-------|-------------|
| `action` | Filter by action type (e.g., `UPDATE`, `PROMOTE`) |
| `engineerId` | Filter by engineer |
| `promptTemplateId` | Filter by specific template |
| `cursor` | Pagination cursor from previous response |
| `limit` | Results per page (default 50, max 100) |

Requires LEAD or OWNER role.

### How Audit Logging Works

Audit logs are written **fire-and-forget** — they never block or fail the original prompt operation. If the audit write fails (e.g., database timeout), a warning is logged to the server console, but the user's action succeeds normally.

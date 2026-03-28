# Voluntary Commit Tagging

## Overview

Commit tagging is a lightweight way to capture AI tool usage when the gateway proxy isn't in the loop. Engineers add a trailer to their commit messages indicating which AI tool assisted them.

## Format

Add an `AI-Assisted-By` trailer to your commit message:

```
Fix authentication bug in login flow

AI-Assisted-By: cursor
```

Multiple tools can be tagged:

```
Refactor database queries for performance

AI-Assisted-By: copilot
AI-Assisted-By: claude
```

## Supported Tool Names

| Tool | Trailer Value |
|------|--------------|
| Cursor | `cursor` |
| GitHub Copilot | `copilot` |
| Claude Code | `claude` |
| OpenAI Codex | `codex` |
| Continue.dev | `continue` |
| Custom | Any string |

## How It Works

1. Engineer commits with `AI-Assisted-By: cursor` trailer
2. GitHub/GitLab webhook fires on push
3. AIRails webhook receiver parses the commit message
4. An `AiActivity` record is created with `captureMethod: COMMIT_TAG`

## Data Richness

Tagged commits provide partial data (tool name, branch, commit SHA) but not the full context available through the gateway proxy (tokens, cost, prompt content). This is reflected in the data richness classification:

| Capture Method | Data Richness | What You Get |
|---------------|---------------|--------------|
| Gateway Proxy | FULL | Tool, model, tokens, cost, prompt snippet |
| Commit Tag | TAGGED | Tool, branch, commit SHA |
| Heuristic | HEURISTIC | Detected patterns, lower confidence |

## Automating Tags

Use a git hook or alias to simplify tagging:

```bash
# Git alias
git config --global alias.aic '!f() { git commit -m "$1" -m "AI-Assisted-By: ${2:-cursor}"; }; f'

# Usage
git aic "Fix bug" cursor
```

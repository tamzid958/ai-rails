# @tamzid958/airails

AI governance CLI for engineering teams. Captures AI tool usage, syncs prompt templates, and manages your AIRAILS setup.

## Install

```bash
npm install -g @tamzid958/airails --registry https://npm.pkg.github.com
```

Requires Node.js 20+.

## Quick Start

```bash
# Initialize in your repo
airails init

# Configure your API key
airails config set --api-key <your-key>

# Verify setup
airails doctor

# Sync prompt templates to your IDE configs
airails sync
```

## Commands

### Core

| Command | Description |
|---------|-------------|
| `airails init` | Initialize AIRAILS in the current repo |
| `airails sync` | Generate IDE configs (Cursor, Claude, Copilot) from prompt templates |
| `airails setup` | Patch IDE settings to use the AIRAILS gateway |
| `airails hooks install` | Install git hooks to auto-sync on commit |
| `airails doctor` | Validate setup and connectivity |
| `airails config show` | Show current configuration |
| `airails config set` | Update config (e.g. `--api-key`, `--gateway-url`) |

### Management

| Command | Description |
|---------|-------------|
| `airails products list` | List your products |
| `airails keys create --label "Cursor"` | Create an API key |
| `airails keys list` | List API keys |
| `airails members list` | List product members |
| `airails members add --email user@co.com` | Add a member |
| `airails repos list` | List linked repositories |
| `airails repos add --name org/repo` | Link a repository |
| `airails prompts list` | List prompt templates |

### AI Tagging

| Command | Description |
|---------|-------------|
| `airails commit --ai cursor -m "feat: add login"` | Commit with AI metadata |
| `airails tag --tool copilot` | Tag the last commit retroactively |
| `airails status` | Show tagging stats for this repo |

## Configuration

The CLI stores config in `.airails/config.yml` in your repo root:

```yaml
product:
  slug: payments-api
gateway:
  url: http://localhost:8080
sync:
  tools:
    - cursor
    - claude
    - copilot
```

Credentials are stored in `~/.airails/credentials.yml` with `0600` permissions.

## License

BUSL-1.1

#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
#  AIRails — Production Deploy Script
#  Usage: ./deploy.sh
# ─────────────────────────────────────────────────────────────

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# ── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${BLUE}${BOLD}"
  echo "  ╔═══════════════════════════════════════╗"
  echo "  ║         AIRails Production Deploy      ║"
  echo "  ╚═══════════════════════════════════════╝"
  echo -e "${NC}"
}

info()    { echo -e "  ${BLUE}ℹ${NC}  $1"; }
success() { echo -e "  ${GREEN}✓${NC}  $1"; }
warn()    { echo -e "  ${YELLOW}⚠${NC}  $1"; }
error()   { echo -e "  ${RED}✗${NC}  $1"; }
step()    { echo -e "\n${CYAN}${BOLD}[$1/$TOTAL_STEPS]${NC} ${BOLD}$2${NC}"; }

prompt_value() {
  local var_name="$1"
  local prompt_text="$2"
  local default="$3"
  local secret="${4:-false}"

  if [ "$secret" = "true" ]; then
    echo -ne "  ${CYAN}?${NC}  ${prompt_text}"
    [ -n "$default" ] && echo -ne " ${YELLOW}[****hidden]${NC}" || echo -ne " ${YELLOW}[empty]${NC}"
    echo -ne ": "
    read -rs value
    echo ""
  else
    echo -ne "  ${CYAN}?${NC}  ${prompt_text}"
    [ -n "$default" ] && echo -ne " ${YELLOW}[$default]${NC}" || echo -ne " ${YELLOW}[empty]${NC}"
    echo -ne ": "
    read -r value
  fi

  value="${value:-$default}"
  eval "$var_name=\"$value\""
}

prompt_yes_no() {
  local prompt_text="$1"
  local default="${2:-y}"
  local hint="Y/n"
  [ "$default" = "n" ] && hint="y/N"

  echo -ne "  ${CYAN}?${NC}  ${prompt_text} ${YELLOW}[$hint]${NC}: "
  read -r answer
  answer="${answer:-$default}"
  [[ "$answer" =~ ^[Yy] ]]
}

generate_secret() {
  openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n'
}

TOTAL_STEPS=7

# ─────────────────────────────────────────────────────────────
#  Start
# ─────────────────────────────────────────────────────────────

print_banner

# ── Step 1: Prerequisites ────────────────────────────────────
step 1 "Checking prerequisites"

missing=()
for cmd in docker openssl; do
  if command -v "$cmd" &>/dev/null; then
    success "$cmd found"
  else
    missing+=("$cmd")
    error "$cmd not found"
  fi
done

if ! docker compose version &>/dev/null; then
  missing+=("docker-compose-v2")
  error "docker compose v2 not found (required)"
else
  success "docker compose v2 found"
fi

if ! docker info &>/dev/null 2>&1; then
  error "Docker daemon is not running"
  echo -e "\n  Please start Docker and re-run this script."
  exit 1
fi
success "Docker daemon is running"

if [ ${#missing[@]} -gt 0 ]; then
  error "Missing required tools: ${missing[*]}"
  echo -e "\n  Install them and re-run this script."
  exit 1
fi

# ── Step 2: Environment file ────────────────────────────────
step 2 "Setting up environment"

if [ -f "$ENV_FILE" ]; then
  warn ".env already exists"
  if prompt_yes_no "Re-configure .env? (No = keep existing)" "n"; then
    CONFIGURE_ENV=true
    cp "$ENV_FILE" ".env.backup.$(date +%s)"
    success "Backed up existing .env"
  else
    CONFIGURE_ENV=false
    success "Keeping existing .env"
  fi
else
  CONFIGURE_ENV=true
  info "No .env found — will create one"
fi

if [ "$CONFIGURE_ENV" = true ]; then
  echo ""
  info "Configure your deployment (press Enter to accept defaults):"
  echo ""

  # ── Database ──
  echo -e "  ${BOLD}Database${NC}"
  prompt_value DB_URL "PostgreSQL connection URL" "postgresql://airails:changeme@postgres:5432/airails"

  # ── Domain / URLs ──
  echo ""
  echo -e "  ${BOLD}Domain${NC}"
  prompt_value DOMAIN "Your domain (e.g. airails.example.com)" ""
  if [ -n "$DOMAIN" ]; then
    DEFAULT_DASHBOARD_URL="https://$DOMAIN"
    DEFAULT_GATEWAY_URL="https://$DOMAIN:8080"
    DEFAULT_CORS="https://$DOMAIN"
  else
    DEFAULT_DASHBOARD_URL="http://localhost:3000"
    DEFAULT_GATEWAY_URL="http://localhost:8080"
    DEFAULT_CORS=""
  fi
  prompt_value DASHBOARD_URL "Dashboard URL" "$DEFAULT_DASHBOARD_URL"
  prompt_value GATEWAY_URL "Gateway URL" "$DEFAULT_GATEWAY_URL"
  prompt_value CORS_VAL "CORS origin (dashboard URL)" "$DEFAULT_CORS"

  # ── Secrets (auto-generate) ──
  echo ""
  echo -e "  ${BOLD}Secrets${NC} ${YELLOW}(auto-generated if left empty)${NC}"
  DEFAULT_AIRAILS_SECRET="$(generate_secret)"
  DEFAULT_AUTH_SECRET="$(generate_secret)"
  DEFAULT_WEBHOOK_SECRET="$(generate_secret)"
  DEFAULT_LITELLM_KEY="sk-$(generate_secret | head -c 48)"

  prompt_value AIRAILS_SECRET_VAL "AIRAILS_SECRET" "$DEFAULT_AIRAILS_SECRET" true
  prompt_value AUTH_SECRET_VAL "AUTH_SECRET" "$DEFAULT_AUTH_SECRET" true
  prompt_value WEBHOOK_SECRET_VAL "AIRAILS_WEBHOOK_SECRET" "$DEFAULT_WEBHOOK_SECRET" true
  prompt_value LITELLM_KEY_VAL "LITELLM_MASTER_KEY" "$DEFAULT_LITELLM_KEY" true

  # ── LLM API Keys ──
  echo ""
  echo -e "  ${BOLD}LLM Provider Keys${NC} ${YELLOW}(at least one recommended)${NC}"
  prompt_value OPENAI_KEY "OpenAI API key" "" true
  prompt_value ANTHROPIC_KEY "Anthropic API key" "" true

  # ── OAuth (optional) ──
  echo ""
  echo -e "  ${BOLD}OAuth Providers${NC} ${YELLOW}(optional — press Enter to skip)${NC}"

  GITHUB_CID="" GITHUB_CSEC=""
  GITLAB_CID="" GITLAB_CSEC=""
  GOOGLE_CID="" GOOGLE_CSEC=""
  MS_CID="" MS_CSEC="" MS_TID="common"

  if prompt_yes_no "Configure GitHub OAuth?" "n"; then
    prompt_value GITHUB_CID "GitHub Client ID" ""
    prompt_value GITHUB_CSEC "GitHub Client Secret" "" true
  fi
  if prompt_yes_no "Configure GitLab OAuth?" "n"; then
    prompt_value GITLAB_CID "GitLab Client ID" ""
    prompt_value GITLAB_CSEC "GitLab Client Secret" "" true
  fi
  if prompt_yes_no "Configure Google OAuth?" "n"; then
    prompt_value GOOGLE_CID "Google Client ID" ""
    prompt_value GOOGLE_CSEC "Google Client Secret" "" true
  fi
  if prompt_yes_no "Configure Microsoft OAuth?" "n"; then
    prompt_value MS_CID "Microsoft Client ID" ""
    prompt_value MS_CSEC "Microsoft Client Secret" "" true
    prompt_value MS_TID "Microsoft Tenant ID" "common"
  fi

  # ── Access Control ──
  echo ""
  echo -e "  ${BOLD}Access Control${NC}"
  prompt_value EMAIL_DOMAINS "Allowed email domains (comma-separated, empty = all)" ""
  prompt_value INVITE_ONLY_VAL "Invite-only mode (true/false)" "true"
  prompt_value PRODUCT_CREATION_VAL "Who can create products (anyone/owners)" "owners"

  # ── Logging ──
  echo ""
  echo -e "  ${BOLD}Logging${NC}"
  prompt_value LOG_LEVEL_VAL "Log level (debug/info/warn/error)" "info"

  # ── Write .env ──
  cat > "$ENV_FILE" <<EOF
# Database
DATABASE_URL=$DB_URL

# Redis
REDIS_URL=redis://redis:6379

# Gateway
AIRAILS_SECRET=$AIRAILS_SECRET_VAL
AIRAILS_PORT=8080
LITELLM_URL=http://litellm:4000

# LiteLLM
LITELLM_MASTER_KEY=$LITELLM_KEY_VAL
OPENAI_API_KEY=$OPENAI_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# Dashboard
NEXT_PUBLIC_GATEWAY_URL=$GATEWAY_URL
NEXT_PUBLIC_DASHBOARD_URL=$DASHBOARD_URL

# OAuth — GitHub
GITHUB_CLIENT_ID=$GITHUB_CID
GITHUB_CLIENT_SECRET=$GITHUB_CSEC

# OAuth — GitLab
GITLAB_CLIENT_ID=$GITLAB_CID
GITLAB_CLIENT_SECRET=$GITLAB_CSEC

# OAuth — Google
GOOGLE_CLIENT_ID=$GOOGLE_CID
GOOGLE_CLIENT_SECRET=$GOOGLE_CSEC

# OAuth — Microsoft (Entra ID / Azure AD)
MICROSOFT_CLIENT_ID=$MS_CID
MICROSOFT_CLIENT_SECRET=$MS_CSEC
MICROSOFT_TENANT_ID=$MS_TID

# NextAuth
AUTH_SECRET=$AUTH_SECRET_VAL
AUTH_TRUST_HOST=true

# Access Control
ALLOWED_EMAIL_DOMAINS=$EMAIL_DOMAINS
INVITE_ONLY=$INVITE_ONLY_VAL
PRODUCT_CREATION=$PRODUCT_CREATION_VAL

# Webhook
AIRAILS_WEBHOOK_SECRET=$WEBHOOK_SECRET_VAL
WEBHOOK_PORT=8081

# Production
CORS_ORIGIN=$CORS_VAL

# Logging
LOG_LEVEL=$LOG_LEVEL_VAL
LOG_PROMPTS=false
LOG_RESPONSES=false
EOF

  success ".env written"
fi

# ── Step 3: Validate required vars ──────────────────────────
step 3 "Validating configuration"

source_env() {
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}
source_env

ERRORS=0
for var in DATABASE_URL AIRAILS_SECRET AUTH_SECRET AIRAILS_WEBHOOK_SECRET LITELLM_MASTER_KEY; do
  val="${!var:-}"
  if [ -z "$val" ] || [ "$val" = "change-this" ] || [ "$val" = "change-this-to-a-random-secret" ] || [ "$val" = "changeme" ]; then
    error "$var is missing or still has a placeholder value"
    ERRORS=$((ERRORS + 1))
  else
    success "$var is set"
  fi
done

if [ -z "${OPENAI_API_KEY:-}" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  warn "No LLM API key set — AI features won't work until you add one"
fi

if [ "$ERRORS" -gt 0 ]; then
  error "$ERRORS required variable(s) need attention"
  echo -e "\n  Edit ${BOLD}.env${NC} and re-run this script."
  exit 1
fi

# ── Step 4: Build images ────────────────────────────────────
step 4 "Building Docker images"

info "This may take a few minutes on first run..."
docker compose $COMPOSE_FILES build --parallel 2>&1 | while IFS= read -r line; do
  echo "  $line"
done
success "All images built"

# ── Step 5: Database migrations ──────────────────────────────
step 5 "Running database migrations"

info "Starting database-dependent services..."
docker compose $COMPOSE_FILES up -d redis 2>/dev/null

# Run migrations via the dashboard container (has prisma)
docker compose $COMPOSE_FILES run --rm --no-deps \
  -e DATABASE_URL="${DATABASE_URL}" \
  dashboard npx prisma migrate deploy 2>&1 | while IFS= read -r line; do
  echo "  $line"
done
success "Migrations applied"

# ── Step 6: Start services ──────────────────────────────────
step 6 "Starting all services"

docker compose $COMPOSE_FILES up -d 2>&1 | while IFS= read -r line; do
  echo "  $line"
done

info "Waiting for services to become healthy..."
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  HEALTHY=$(docker compose $COMPOSE_FILES ps --format json 2>/dev/null | grep -c '"healthy"' || true)
  TOTAL=$(docker compose $COMPOSE_FILES ps --format json 2>/dev/null | grep -c '"running"\|"healthy"' || true)

  if [ "$TOTAL" -ge 4 ]; then
    # Check each critical service
    ALL_UP=true
    for svc in gateway dashboard webhook litellm redis; do
      STATUS=$(docker compose $COMPOSE_FILES ps "$svc" --format '{{.Status}}' 2>/dev/null || echo "")
      if echo "$STATUS" | grep -qi "healthy"; then
        : # good
      elif echo "$STATUS" | grep -qi "up"; then
        : # still starting
        ALL_UP=false
      else
        ALL_UP=false
      fi
    done
    if [ "$ALL_UP" = true ]; then
      break
    fi
  fi

  sleep 3
  ELAPSED=$((ELAPSED + 3))
  echo -ne "\r  Waiting... ${ELAPSED}s / ${TIMEOUT}s"
done
echo ""

if [ $ELAPSED -ge $TIMEOUT ]; then
  warn "Some services may still be starting — check with: docker compose $COMPOSE_FILES ps"
else
  success "All services are up"
fi

# ── Step 7: Summary ─────────────────────────────────────────
step 7 "Deployment complete"

echo ""
echo -e "  ${BOLD}Service Status:${NC}"
docker compose $COMPOSE_FILES ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | while IFS= read -r line; do
  echo "  $line"
done

DASH_URL="${NEXT_PUBLIC_DASHBOARD_URL:-http://localhost:3000}"
GW_URL="${NEXT_PUBLIC_GATEWAY_URL:-http://localhost:8080}"

echo ""
echo -e "  ${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}${BOLD}  Dashboard:${NC}  $DASH_URL"
echo -e "  ${GREEN}${BOLD}  Gateway:${NC}    $GW_URL"
echo -e "  ${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo "    Logs:      docker compose $COMPOSE_FILES logs -f"
echo "    Status:    docker compose $COMPOSE_FILES ps"
echo "    Stop:      docker compose $COMPOSE_FILES down"
echo "    Restart:   docker compose $COMPOSE_FILES restart"
echo ""

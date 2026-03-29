"use client";

import { useProduct } from "@/lib/product-context";
import { useState } from "react";
import {
  Terminal, GitBranch, DollarSign,
  CheckCircle, AlertTriangle, Copy, ArrowRight, BookOpen,
} from "lucide-react";

/* ─── Primitives ─── */

function Code({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ margin: "16px 0", borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border-subtle)" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px", background: "var(--color-surface-overlay)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: 11 }}>
          <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{label}</span>
          <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            {copied ? <><CheckCircle size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        </div>
      )}
      <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.8, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", background: "var(--color-surface)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {children}
      </pre>
    </div>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const c = {
    info: { bg: "rgba(59,130,246,0.06)", border: "#2563eb", icon: <AlertTriangle size={13} />, label: "Note" },
    warning: { bg: "rgba(251,191,36,0.06)", border: "#d97706", icon: <AlertTriangle size={13} />, label: "Warning" },
    tip: { bg: "rgba(52,211,153,0.06)", border: "#10b981", icon: <CheckCircle size={13} />, label: "Good to know" },
  }[type];
  return (
    <div style={{ margin: "20px 0", padding: "16px 20px", borderRadius: 8, background: c.bg, borderLeft: `3px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: c.border }}>
        {c.icon}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>{c.label}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.85, margin: "14px 0" }}>{children}</p>;
}

function S({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{children}</strong>;
}

function Mono({ children }: { children: string }) {
  return <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-accent)", background: "var(--color-surface)", padding: "2px 6px", borderRadius: 4 }}>{children}</code>;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} style={{ fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--color-text-primary)", margin: "0 0 6px", scrollMarginTop: 80 }}>{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: "28px 0 10px" }}>{children}</h3>;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--color-border-subtle)", margin: "48px 0" }} />;
}

function Pill({ children, color }: { children: string; color: string }) {
  return <span style={{ display: "inline-flex", padding: "2px 8px", fontSize: 11, fontWeight: 500, borderRadius: 4, background: color, color: "#fff" }}>{children}</span>;
}

function ListItem({ icon: Icon, title, children }: { icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; title?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0" }}>
      {Icon ? (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--color-surface-overlay)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <Icon size={13} strokeWidth={1.5} />
        </div>
      ) : (
        <ArrowRight size={12} strokeWidth={1.5} style={{ color: "var(--color-accent)", marginTop: 5, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1 }}>
        {title && <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 3 }}>{title}</p>}
        <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function Card({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }) {
  return (
    <div style={{ padding: "20px 24px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--color-accent-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} strokeWidth={1.5} className="text-accent" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.65 }}>{description}</p>
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: string }) {
  return <a href={`#${href}`} style={{ display: "block", padding: "4px 0", fontSize: 12, color: "var(--color-text-muted)", textDecoration: "none" }} className="hover:text-text-primary!">{children}</a>;
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
      {children}
    </div>
  );
}

/* ─── Page ─── */

export default function GuidePage() {
  const { product } = useProduct();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--color-accent-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={18} strokeWidth={1.5} className="text-accent" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>Guide</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Everything you need to use AIRAILS with {product.name}</p>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:1023px){.guide-toc{display:none !important}}`}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 72 }}>
        <div style={{ minWidth: 0 }}>

          {/* ─── Capture Methods ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
            <Card icon={Terminal} title="Gateway Capture" description="Route AI requests through AIRAILS. Captures tokens, cost, latency, and model data automatically." />
            <Card icon={GitBranch} title="Commit Tagging" description="Tag commits with AI tool metadata. Lightweight — works without a proxy." />
          </div>
          <Callout type="tip">Use both together for maximum coverage. Gateway gives cost + token data. Tagging catches everything else.</Callout>

          <Divider />

          {/* ─── CLI Setup ─── */}
          <H2 id="cli">CLI Setup</H2>
          <P>The AIRAILS CLI is used for commit tagging, IDE configuration, and managing your setup.</P>

          <H3>Install</H3>
          <Code label="Terminal">{`npm install -g @airails/cli`}</Code>

          <H3>Initialize in your repo</H3>
          <Code label="Terminal">{`cd your-project
airails init --product ${product.slug} --gateway http://localhost:8080`}</Code>
          <P>Or run <Mono>airails init</Mono> without flags for interactive setup — it will prompt for product name, slug, and optionally create the product via the API.</P>

          <H3>Configure API key</H3>
          <Code label="Terminal">{`# Save your API key (creates/updates .env)
airails config set --api-key airails_sk_xxxxxxxxxxxx

# Or set via environment variable
export AIRAILS_API_KEY=airails_sk_xxxxxxxxxxxx`}</Code>

          <H3>Auto-configure IDE</H3>
          <Code label="Terminal">{`# Patches Cursor, Continue, VS Code configs to use the gateway
airails setup`}</Code>

          <H3>Verify</H3>
          <Code label="Terminal">{`# Check your configuration
airails config show

# Run diagnostics
airails doctor`}</Code>

          <Callout type="tip">Run <Mono>airails hooks install</Mono> to auto-tag commits with AI metadata on every git commit.</Callout>

          <Divider />

          {/* ─── Quickstart ─── */}
          <H2 id="quickstart">Quickstart</H2>
          <P>Two ways to capture AI usage. Choose one or use both.</P>

          <H3>Option A — Gateway (recommended)</H3>
          <P>The gateway proxies AI requests through AIRAILS. Your tool works exactly the same — AIRAILS observes silently and logs telemetry.</P>

          <P><S>Step 1.</S> Create an API key in <S>Settings → API Keys</S></P>
          <Code label="Terminal">{`airails keys create --product ${product.slug} --label "Cursor"`}</Code>

          <P><S>Step 2.</S> Point your AI tool at the gateway</P>
          <Code label=".env or IDE settings">{`OPENAI_API_BASE=http://localhost:8080/v1
OPENAI_API_KEY=airails_sk_xxxxxxxxxxxx`}</Code>

          <P><S>Step 3.</S> Code as usual. Every AI request is now captured.</P>

          <Code label="Verify it works">{`curl http://localhost:8080/v1/chat/completions \\
  -H "Authorization: Bearer airails_sk_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hello"}]}'`}</Code>

          <Callout type="info">The gateway is powered by LiteLLM. It supports OpenAI, Anthropic, Ollama, and any OpenAI-compatible provider. Your prompts pass through unchanged.</Callout>

          <H3>Option B — Commit Tagging</H3>
          <P>Lightweight alternative if you can&apos;t proxy through the gateway.</P>

          <Code label="Install">{`npm install -g @airails/cli`}</Code>

          <Code label="Usage">{`# CLI wrapper
airails commit --ai cursor -m "feat: add login"

# Or tag any git commit
git commit -m "feat: add login [ai:cursor]"

# Tag after the fact
airails tag --tool copilot --branch feature/auth`}</Code>

          <Callout type="warning">Commit tagging tracks tool usage but not tokens or cost. For full telemetry, use the gateway.</Callout>

          <Divider />

          {/* ─── Dashboard ─── */}
          <H2 id="dashboard">Dashboard</H2>
          <P>Two views, designed for different audiences.</P>

          <H3>Engineer View</H3>
          <P>Your personal AI usage. Available to all team members.</P>

          <ListItem title="Overview">Activity timeline, stat cards, tool distribution chart, recent activity table with pagination.</ListItem>
          <ListItem title="Usage">Token consumption, cost breakdown by model and task type. Requires gateway data.</ListItem>
          <ListItem title="Prompts">Your prompt templates and personal overrides with per-template acceptance rates.</ListItem>
          <ListItem title="Effectiveness">Acceptance, revision, and rejection rates. Compares your performance to team average.</ListItem>

          <H3>Team View</H3>
          <P>Aggregated metrics. Visible to <Pill color="#064e3b">LEAD</Pill> and <Pill color="#4c1d95">OWNER</Pill> roles.</P>

          <ListItem title="Overview">Team-wide trends, data coverage breakdown, AI-powered insights with pagination.</ListItem>
          <ListItem title="Engineers">Compare individuals — activity, acceptance rate, cost, tools used. Sortable columns.</ListItem>
          <ListItem title="Costs">Spending by engineer, model, and task type. Threshold alerts flag overspending.</ListItem>
          <ListItem title="Drift">Configuration drift detection — model violations, stale overrides, capture gaps. Scored per engineer.</ListItem>
          <ListItem title="Audit">Immutable changelog of every prompt template change with before/after diffs and acceptance rate correlation.</ListItem>
          <ListItem title="Outcomes">PR outcomes correlated with AI usage. Filter by status and data richness.</ListItem>
          <ListItem title="Prompts">Prompt registry — review overrides, promote top performers to base.</ListItem>

          <Divider />

          {/* ─── Admin Setup ─── */}
          <H2 id="admin">Admin Setup</H2>
          <P>One-time setup for product owners.</P>

          <H3>1. Add Repositories</H3>
          <P>Link your GitHub or GitLab repos in <S>Settings → Repositories</S>. This enables PR correlation — AIRAILS matches AI activity to pull request outcomes.</P>

          <Code label="Events tracked">{`Pull request opened / merged / closed
Pull request reviews (approved, changes requested)
Branch pushes (correlated with commit tags)`}</Code>

          <H3>2. Invite Engineers</H3>
          <P>Add engineers by email in <S>Settings → Members</S>. Three roles:</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Pill color="#4c1d95">OWNER</Pill>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>Full access — manage settings, members, models, and all data.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Pill color="#064e3b">LEAD</Pill>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>Team view — manage repos, API keys, view all engineers, promote prompts.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Pill color="#2a2d35">MEMBER</Pill>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>Personal dashboard only — cannot see other engineers&apos; data.</span>
            </div>
          </div>

          <H3>3. Configure Webhooks</H3>
          <P>Get your webhook URL from <S>Settings → Webhooks</S>, then add to each repo.</P>

          <Code label="GitHub">{`Payload URL:  https://your-host:8081/webhook/github
Content type: application/json
Secret:       (AIRAILS_WEBHOOK_SECRET from .env)
Events:       Pull requests, Pull request reviews`}</Code>

          <Code label="GitLab">{`URL:     https://your-host:8081/webhook/gitlab
Secret:  (AIRAILS_WEBHOOK_SECRET from .env)
Trigger: Merge request events`}</Code>

          <Divider />

          {/* ─── Models ─── */}
          <H2 id="models">Model Management</H2>
          <P>Control which AI models your team can access.</P>

          <H3>Allowlists</H3>
          <P>By default all models are available. Block or enable specific models in <S>Settings → Providers</S>, or set an allowlist in <S>Product Settings</S>.</P>

          <H3>Adding Models</H3>
          <P>AIRAILS uses LiteLLM as its router. Add models to the config:</P>

          <Code label="litellm/config.yaml">{`model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o

  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-6-20250620

  # Add your own
  - model_name: my-model
    litellm_params:
      model: openai/my-model
      api_base: https://my-provider.com/v1`}</Code>

          <Code label="Apply changes">{`docker compose restart litellm gateway`}</Code>

          <Divider />

          {/* ─── Costs ─── */}
          <H2 id="costs">Cost Management</H2>
          <P>Monitor and control AI spending.</P>

          <P>Set thresholds in <S>Product Settings → Cost Alerts</S>:</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <ListItem icon={DollarSign} title="Daily threshold">Total product-wide spend per day. Flagged in the Cost Center when exceeded.</ListItem>
            <ListItem icon={DollarSign} title="Per-engineer daily">Individual spend per day. Engineers exceeding this show a red indicator.</ListItem>
          </div>

          <Callout type="info">Cost data requires gateway capture. Commit-tagged sessions don&apos;t include cost info.</Callout>

          <Divider />

          {/* ─── Prompts ─── */}
          <H2 id="prompts">Prompt Templates</H2>
          <P>Standardize how your team uses AI tools. Track what works, promote the best approaches.</P>

          <H3>For Engineers — Using Templates</H3>
          <P>When you use AI through the gateway, AIRAILS can apply a prompt template based on the task type. This gives your AI consistent context about your team&apos;s conventions.</P>

          <Code label="Example: code-review base template">{`You are reviewing code for a production application.

Rules:
- Flag security issues (SQL injection, XSS, hardcoded secrets)
- Check error handling at system boundaries
- Verify test coverage for new logic
- Suggest performance improvements only if measurable
- Use team naming conventions (camelCase JS, snake_case Python)

Do not suggest cosmetic changes or add unnecessary comments.`}</Code>

          <H3>For Engineers — Creating Overrides</H3>
          <P>If the base doesn&apos;t fit your workflow, create a personal override in <S>Engineer → Prompts</S>. AIRAILS tracks its acceptance rate separately.</P>

          <Code label="Example: personal override">{`You are reviewing code for a production application.

# Team rules apply, plus my additions:
- I work on payments — always check decimal precision
- Flag API calls without timeout/retry
- I prefer explicit error types over generic Error
- Skip style suggestions — we have prettier`}</Code>

          <Callout type="tip">If your override consistently outperforms the base, a lead can promote it — making your approach the standard for the whole team.</Callout>

          <H3>For Leads — Managing the Registry</H3>
          <P>Go to <S>Team → Prompts</S> to see all templates and overrides.</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            <ListItem title="Compare">See which overrides have higher acceptance rates than the base.</ListItem>
            <ListItem title="Promote">Click &quot;Promote&quot; on a top-performing override. It replaces the base for everyone.</ListItem>
            <ListItem title="Track">Usage counts show how many engineers actively use each template version.</ListItem>
          </div>

          <Callout type="info">When you promote an override, the current base is archived. Engineers with their own overrides are not affected — only those using the base get the new version.</Callout>

          <Divider />

          {/* ─── Drift ─── */}
          <H2 id="drift">Config Drift</H2>
          <P>Drift happens when engineers&apos; setups diverge from the team standard. AIRAILS evaluates three dimensions per engineer over a <S>rolling 30-day window</S> and assigns a composite score.</P>

          <H3>Three Dimensions</H3>

          <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "18px 20px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Model Drift</p>
                <Pill color="#7f1d1d">+3 per violation</Pill>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.65 }}>Engineer used a model not in the product&apos;s allowlist. Example: using <Mono>gpt-3.5-turbo</Mono> when the team allows only <Mono>gpt-4o</Mono> and <Mono>claude-sonnet-4-5</Mono>. Each non-allowed model adds 3 points. Skipped if the allowlist is empty (all models permitted).</p>
            </div>
            <div style={{ padding: "18px 20px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Template Drift</p>
                <Pill color="#78350f">+2 per stale override</Pill>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.65 }}>An override is <S>stale</S> when the base template was updated after the override was last edited. An override is <S>orphaned</S> when its base template no longer exists. Each issue adds 2 points.</p>
            </div>
            <div style={{ padding: "18px 20px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Tool Sync</p>
                <Pill color="#78350f">+1 if partial</Pill>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.65 }}>Checks capture method diversity. If an engineer has commit tagging but no gateway data, they&apos;re missing cost and token metrics (+1 point). If they have neither, it&apos;s noted as &quot;no recent activity&quot; but not scored.</p>
            </div>
          </div>

          <H3>Drift Scoring</H3>
          <P>The composite score maps to a severity level. Check <S>Team → Drift</S> for a per-engineer breakdown, sorted worst-first.</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {([
              ["NONE", "Score 0 — fully aligned with team configuration", "#064e3b"],
              ["LOW", "Score 1–2 — minor issue, e.g., partial capture only", "#78350f"],
              ["MEDIUM", "Score 3–4 — a non-allowed model or multiple stale overrides", "#d97706"],
              ["HIGH", "Score 5+ — multiple violations, needs immediate attention", "#7f1d1d"],
            ] as const).map(([level, desc, bg]) => (
              <div key={level} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Pill color={bg}>{level}</Pill>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{desc}</span>
              </div>
            ))}
          </div>

          <H3>Dashboard Columns</H3>
          <P>The drift table shows each engineer with these columns:</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            <ListItem title="Drift">Severity badge — NONE, LOW, MEDIUM, or HIGH.</ListItem>
            <ListItem title="Models">Count of non-allowed models, or &quot;OK&quot; if compliant.</ListItem>
            <ListItem title="Templates">Stale override count, or ratio like 2/5 (overrides / total bases).</ListItem>
            <ListItem title="Gateway">Icon showing whether the engineer has gateway activity.</ListItem>
            <ListItem title="Last Sync">Time since the engineer&apos;s last <Mono>airails sync</Mono> event.</ListItem>
            <ListItem title="Details">Expandable — every drift reason as human-readable text.</ListItem>
          </div>

          <H3>Resolving Drift</H3>
          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            <ListItem title="Model drift">Engineer switches to an allowed model, or a lead updates the allowlist in Product Settings.</ListItem>
            <ListItem title="Stale overrides">Engineer runs <Mono>airails sync</Mono> or updates their override in the dashboard to incorporate base template changes.</ListItem>
            <ListItem title="No gateway data">Configure the gateway proxy so AI requests are captured with full token and cost data.</ListItem>
          </div>

          <Callout type="tip">Run a drift check after promoting a template or changing the model allowlist. It shows who needs to update.</Callout>

          <Divider />

          {/* ─── Audit ─── */}
          <H2 id="audit">Prompt Audit</H2>
          <P>An immutable changelog of every prompt template modification. Answers: <S>who changed what, when, and how did it affect code quality?</S></P>

          <H3>What Gets Logged</H3>
          <P>Every prompt operation is automatically recorded with before/after content snapshots:</P>

          <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {([
              ["CREATE_BASE", "#064e3b", "A lead creates a new base template for a task type."],
              ["CREATE_OVERRIDE", "#1e3a5f", "An engineer creates a personal override from a base template."],
              ["UPDATE", "#78350f", "An engineer edits their override. Old and new content are both captured."],
              ["PROMOTE", "#4c1d95", "A lead promotes an override to become the new base. Records source engineer and override ID."],
              ["DELETE", "#7f1d1d", "A template is removed. Final content is snapshot for the record."],
            ] as const).map(([action, bg, desc]) => (
              <div key={action} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", borderRadius: 8 }}>
                <Pill color={bg}>{action}</Pill>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.65 }}>{desc}</span>
              </div>
            ))}
          </div>

          <H3>Using the Audit Page</H3>
          <P>Go to <S>Team → Audit</S> to see the full log. Available to LEADs and OWNERs.</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            <ListItem title="Timeline table">Every event with timestamp, engineer name, action badge, template name, task type, and version number.</ListItem>
            <ListItem title="Diff view">Click any row to expand a side-by-side comparison. Changed lines are highlighted in red (removed) and green (added).</ListItem>
            <ListItem title="Filter by action">Use the dropdown to narrow the log — e.g., show only promotions or updates.</ListItem>
            <ListItem title="Acceptance rate">Each row shows the template&apos;s current acceptance rate, so you can correlate prompt changes with quality outcomes.</ListItem>
            <ListItem title="Pagination">Load older entries with cursor-based pagination without performance issues.</ListItem>
          </div>

          <Callout type="info">Audit logs are immutable and fire-and-forget — they never block or fail the original prompt operation. If a log write fails, the user&apos;s action still succeeds.</Callout>

          <H3>Common Workflows</H3>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            <ListItem title="Investigate a quality drop">Filter by template → find the UPDATE that coincides with the acceptance rate drop → compare before/after content.</ListItem>
            <ListItem title="Review a promotion">Filter by PROMOTE → see which override was promoted, by whom, and what content replaced the base.</ListItem>
            <ListItem title="Onboard new leads">Audit page gives full context on how templates evolved — no need to dig through git history.</ListItem>
          </div>

          <Divider />

          {/* ─── API Keys ─── */}
          <H2 id="keys">API Keys</H2>
          <P>Keys authenticate gateway requests. Each key is scoped to one product.</P>

          <div style={{ margin: "14px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Create one key per tool (Cursor, Copilot, CLI) for granular tracking",
              "Keys are shown once at creation — copy immediately",
              "Revoke compromised keys instantly in Settings → API Keys",
              "All data stays on your infrastructure — keys never leave",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
                <CheckCircle size={12} strokeWidth={1.5} style={{ color: "var(--color-success)", marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ─── TOC ─── */}
        <div className="guide-toc" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <NavGroup label="Getting Started">
            <NavItem href="cli">CLI Setup</NavItem>
            <NavItem href="quickstart">Quickstart</NavItem>
            <NavItem href="dashboard">Dashboard</NavItem>
          </NavGroup>
          <NavGroup label="Admin">
            <NavItem href="admin">Setup</NavItem>
            <NavItem href="models">Models</NavItem>
            <NavItem href="costs">Costs</NavItem>
          </NavGroup>
          <NavGroup label="Features">
            <NavItem href="prompts">Prompts</NavItem>
            <NavItem href="drift">Config Drift</NavItem>
            <NavItem href="audit">Prompt Audit</NavItem>
            <NavItem href="keys">API Keys</NavItem>
          </NavGroup>
        </div>
      </div>
    </div>
  );
}

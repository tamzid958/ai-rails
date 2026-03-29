"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type WaitingViewProps = {
  email: string;
  signOut: () => Promise<void>;
};

const steps = [
  { n: "01", text: "Ask your team lead or product owner to add you" },
  { n: "02", text: "They\u2019ll add your email in Settings \u2192 Members" },
  { n: "03", text: "Refresh this page \u2014 you\u2019ll be redirected automatically" },
];

export function WaitingView({ email, signOut }: WaitingViewProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-black)", color: "var(--color-text-primary)", display: "grid", gridTemplateRows: "auto 1fr auto" }}>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 72, borderBottom: "1px solid var(--color-border-subtle)" }}>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.18em" }}>AIRAILS</motion.span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
          style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--color-text-muted)" }}>AI GOVERNANCE PLATFORM</motion.span>
      </header>

      {/* Main */}
      <main style={{ display: "grid", alignItems: "center", padding: 48 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}
        >
          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-warning)", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Pending Access</span>
          </div>

          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

          <h1 style={{ fontSize: 28, fontWeight: 300, lineHeight: 1.35, letterSpacing: "-0.02em", marginBottom: 12 }}>
            Waiting for invitation
          </h1>

          <p style={{ fontSize: 14, color: "var(--color-text-tertiary)", lineHeight: 1.7, marginBottom: 40 }}>
            You&apos;re signed in as <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{email}</span>,
            but you haven&apos;t been added to any product yet.
          </p>

          {/* Next steps */}
          <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16 }}>What to do next</p>
          <div style={{ width: 24, height: 1, background: "var(--color-border-muted)", marginBottom: 24 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.12 }}
                style={{ display: "flex", gap: 14 }}
              >
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-muted)", marginTop: 1, flexShrink: 0 }}>{s.n}</span>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{s.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Sign out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            style={{ marginTop: 48 }}
          >
            <form action={signOut}>
              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  background: "transparent",
                  color: "var(--color-text-tertiary)",
                  fontSize: 13,
                  border: "1px solid var(--color-border-muted)",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <span>Sign out and try a different account</span>
                <ArrowRight size={14} strokeWidth={1.5} style={{ opacity: 0.4 }} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 32, height: 56, borderTop: "1px solid var(--color-border-subtle)" }}>
        {["Self-hosted", "Open Core", "SOC 2 Ready"].map((label, i) => (
          <motion.div key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 + i * 0.1 }} style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {i > 0 && <div style={{ width: 1, height: 10, background: "var(--color-border-muted)" }} />}
            <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{label}</span>
          </motion.div>
        ))}
      </footer>
    </div>
  );
}

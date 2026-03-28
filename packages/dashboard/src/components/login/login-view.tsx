"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type LoginViewProps = {
  signInGitHub?: () => Promise<void>;
  signInGitLab?: () => Promise<void>;
};

const features = [
  { n: "01", title: "Capture", desc: "Every AI interaction — IDE sessions, code suggestions, prompt usage — captured automatically." },
  { n: "02", title: "Measure", desc: "Acceptance rates, tool adoption, cost per engineer. Know exactly where AI delivers value." },
  { n: "03", title: "Govern", desc: "Model allowlists, cost alerts, prompt templates. Compliance without slowing teams down." },
];

export function LoginView({ signInGitHub, signInGitLab }: LoginViewProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-black)", color: "var(--color-text-primary)", display: "grid", gridTemplateRows: "auto 1fr auto" }}>

      <style>{`
        @media(min-width:1024px){ .login-grid { grid-template-columns: 1fr 380px !important; gap: 80px !important; } }
        @media(max-width:1023px){ .login-left { display: none !important; } }
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 72, borderBottom: "1px solid var(--color-border-subtle)" }}>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.18em" }}>AIRAILS</motion.span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
          style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--color-text-muted)" }}>AI GOVERNANCE PLATFORM</motion.span>
      </header>

      {/* Main */}
      <main style={{ display: "grid", alignItems: "center", padding: 48 }}>
        <div className="login-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, maxWidth: 960, margin: "0 auto", width: "100%", alignItems: "center" }}>

          {/* Left */}
          <motion.div className="login-left" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}>
            <h2 style={{ fontSize: 32, fontWeight: 300, lineHeight: 1.35, letterSpacing: "-0.02em", marginBottom: 40 }}>
              The command center for<br />
              <span style={{ color: "var(--color-text-tertiary)" }}>AI-assisted engineering</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {features.map((f, i) => (
                <motion.div key={f.n} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.5 + i * 0.15 }} style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-muted)", marginTop: 2, flexShrink: 0 }}>{f.n}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{f.title}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 12 }}>Sign in to continue</p>
            <div style={{ width: 24, height: 1, background: "var(--color-border-muted)", marginBottom: 32 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {signInGitHub && (
                <form action={signInGitHub}>
                  <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", background: "#fff", color: "var(--color-black)", fontSize: 14, fontWeight: 500, border: "none", borderRadius: 6, cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85 0 1.7.114 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" /></svg>
                    <span>Continue with GitHub</span>
                    <ArrowRight size={15} strokeWidth={1.5} style={{ marginLeft: "auto", opacity: 0.4 }} />
                  </button>
                </form>
              )}
              {signInGitLab && (
                <form action={signInGitLab}>
                  <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", background: "transparent", color: "var(--color-text-secondary)", fontSize: 14, border: "1px solid var(--color-border-muted)", borderRadius: 6, cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.6 }}><path d="m23.546 10.93-.033-.09-3.3-8.6a.85.85 0 0 0-.839-.516.87.87 0 0 0-.529.262.86.86 0 0 0-.264.55l-2.23 6.823H7.65L5.42 2.536a.86.86 0 0 0-.264-.55.87.87 0 0 0-.529-.262.85.85 0 0 0-.839.516l-3.3 8.6-.033.09a6.07 6.07 0 0 0 2.014 7.01l.01.008.028.02 4.98 3.727 2.462 1.863 1.5 1.132a1.01 1.01 0 0 0 1.22 0l1.5-1.132 2.462-1.863 5.008-3.748.012-.01a6.07 6.07 0 0 0 2.015-7.01Z" /></svg>
                    <span>Continue with GitLab</span>
                    <ArrowRight size={15} strokeWidth={1.5} style={{ marginLeft: "auto", opacity: 0.3 }} />
                  </button>
                </form>
              )}
            </div>

            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 40, lineHeight: 1.7 }}>
              By continuing, you agree to the processing of your Git activity metadata for AI governance purposes.
            </p>
          </motion.div>
        </div>
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

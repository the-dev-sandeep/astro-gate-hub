import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Download,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { GlassAlert, GlowButton, NeonField } from "@/components/portal/controls";
import {
  CursorSpotlight,
  GlassCard,
  GridBackdrop,
  riseIn,
  stagger,
} from "@/components/portal/effects";
import { loginWithEmail, requestAccess } from "@/lib/portal.functions";
import { RELEASE, saveSession } from "@/lib/portal-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nebula Desktop — Request Access & Download" },
      {
        name: "description",
        content:
          "Request access to the Nebula desktop app, get admin approval, then download signed builds for Windows, macOS and Linux.",
      },
      { property: "og:title", content: "Nebula Desktop — Request Access & Download" },
      {
        property: "og:description",
        content:
          "Gated access portal for the Nebula desktop app: request access, get approved, download verified builds.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Zap, label: "40% faster cold start" },
  { icon: ShieldCheck, label: "Notarized & code-signed" },
  { icon: Cpu, label: "Native Apple Silicon" },
  { icon: Fingerprint, label: "SHA-256 verified builds" },
];

function Landing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"request" | "login">("request");

  const submitRequest = useServerFn(requestAccess);
  const submitLogin = useServerFn(loginWithEmail);

  const [name, setName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    tone: "info" | "success" | "warning" | "error";
    title: string;
    description?: string;
  } | null>(null);

  async function onRequest(event: React.FormEvent) {
    event.preventDefault();
    setAlert(null);
    setFieldError(null);
    if (name.trim().length < 2) return setFieldError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(requestEmail)) return setFieldError("Enter a valid email address.");

    setBusy(true);
    try {
      const result = await submitRequest({ data: { fullName: name, email: requestEmail } });
      if (result.duplicate) {
        setAlert({
          tone: result.status === "approved" ? "success" : "warning",
          title:
            result.status === "approved"
              ? "You already have access."
              : "Request already on file — awaiting review.",
          description: "Switch to User Access Login to continue.",
        });
      } else {
        setAlert({
          tone: "info",
          title: "Request Submitted! Awaiting Admin Authorization.",
          description: "You'll be notified as soon as your access is approved.",
        });
        setName("");
        setRequestEmail("");
      }
    } catch {
      setAlert({ tone: "error", title: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setAlert(null);
    setFieldError(null);
    if (!/^\S+@\S+\.\S+$/.test(loginEmail)) return setFieldError("Enter a valid email address.");

    setBusy(true);
    try {
      const result = await submitLogin({ data: { email: loginEmail } });
      if (result.outcome === "not_found") {
        setFieldError("No access request found for this email.");
      } else if (result.outcome === "pending") {
        setAlert({
          tone: "warning",
          title: "Access status is currently PENDING admin review.",
          description: "Hang tight — approval usually lands within a few hours.",
        });
      } else {
        saveSession(result.user);
        confetti({ particleCount: 160, spread: 78, origin: { y: 0.7 } });
        setAlert({ tone: "success", title: `Access granted. Welcome, ${result.user.fullName}.` });
        setTimeout(() => navigate({ to: "/dashboard" }), 900);
      }
    } catch {
      setAlert({ tone: "error", title: "Sign-in failed. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <GridBackdrop />
      <CursorSpotlight />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={riseIn} className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-secondary/40 px-3 py-1 font-mono text-[11px] tracking-widest text-accent uppercase">
              <Sparkles className="h-3 w-3" /> {RELEASE.tag}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {RELEASE.released} · {RELEASE.size}
            </span>
          </motion.div>

          <motion.h1
            variants={riseIn}
            className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl"
          >
            The desktop engine for <span className="text-gradient">serious operators</span>.
          </motion.h1>

          <motion.p variants={riseIn} className="mt-5 max-w-lg text-base text-muted-foreground">
            Nebula Desktop ships as a gated release. Request access, get authorized by an
            administrator, then pull signed builds for every platform from your private portal.
          </motion.p>

          <motion.div variants={riseIn} className="mt-8 flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <span
                key={feature.label}
                className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-secondary/30 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <feature.icon className="h-3.5 w-3.5 text-primary" />
                {feature.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            variants={riseIn}
            className="mt-10 flex items-center gap-3 text-xs text-muted-foreground"
          >
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full text-success" />
            <span>Release channel operational — 3 platforms live</span>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard className="p-2">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/40 p-1">
              {(
                [
                  ["request", "Request Access"],
                  ["login", "User Access Login"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setAlert(null);
                    setFieldError(null);
                  }}
                  className={`relative h-10 rounded-lg text-sm font-medium transition-colors ${
                    tab === key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === key ? (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-lg bg-gradient-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === "request" ? (
                <form onSubmit={onRequest} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tell us who you are. An administrator reviews every request.
                  </p>
                  <NeonField
                    label="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                  />
                  <NeonField
                    label="Email address"
                    type="email"
                    value={requestEmail}
                    onChange={(event) => setRequestEmail(event.target.value)}
                    autoComplete="email"
                    maxLength={255}
                    error={fieldError ?? undefined}
                  />
                  <GlowButton type="submit" loading={busy} className="w-full">
                    Submit access request <ArrowRight className="h-4 w-4" />
                  </GlowButton>
                </form>
              ) : (
                <form onSubmit={onLogin} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the email you registered with to open your download portal.
                  </p>
                  <NeonField
                    label="Registered email"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    autoComplete="email"
                    maxLength={255}
                    error={fieldError ?? undefined}
                  />
                  <GlowButton type="submit" loading={busy} className="w-full">
                    Enter download portal <Download className="h-4 w-4" />
                  </GlowButton>
                </form>
              )}

              {alert ? (
                <div className="mt-4">
                  <GlassAlert {...alert} />
                </div>
              ) : null}

              <p className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Access is per-email and revocable at any time.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}

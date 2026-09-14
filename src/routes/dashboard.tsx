import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Apple, ChevronDown, Download, LogOut, Monitor, Shield, Terminal } from "lucide-react";

import { GlowButton } from "@/components/portal/controls";
import {
  CursorSpotlight,
  GlassCard,
  GridBackdrop,
  TiltCard,
  riseIn,
  stagger,
} from "@/components/portal/effects";
import { recordDownload, verifySession, type PortalUser } from "@/lib/portal.functions";
import { CHANGELOG, RELEASE, clearSession, readSession, saveSession } from "@/lib/portal-session";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Download Portal — Nebula Desktop" },
      {
        name: "description",
        content:
          "Private download portal for approved users: signed Windows, macOS and Linux builds with checksums and changelog.",
      },
      { property: "og:title", content: "Download Portal — Nebula Desktop" },
      {
        property: "og:description",
        content: "Approved-user download portal with verified builds for every platform.",
      },
    ],
  }),
  component: Dashboard,
});

const ICONS = { windows: Monitor, macos: Apple, linux: Terminal } as const;

function Dashboard() {
  const navigate = useNavigate();
  const check = useServerFn(verifySession);
  const track = useServerFn(recordDownload);

  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [openLog, setOpenLog] = useState<string | null>(CHANGELOG[0]?.version ?? null);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    void check({ data: { email: session.email } }).then((result) => {
      if (!result.valid) {
        clearSession();
        navigate({ to: "/" });
        return;
      }
      saveSession(result.user);
      setUser(result.user);
      setReady(true);
    });
  }, [check, navigate]);

  async function startDownload(os: "windows" | "macos" | "linux", fileName: string) {
    if (!user || progress[os]) return;
    setProgress((prev) => ({ ...prev, [os]: 4 }));

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min((prev[os] ?? 0) + Math.random() * 16, 100);
        return { ...prev, [os]: next };
      });
    }, 180);

    try {
      const result = await track({ data: { email: user.email, os } });
      setUser({ ...user, downloadCount: result.downloadCount });
    } catch {
      /* keep the simulated download going */
    }

    setTimeout(() => {
      clearInterval(timer);
      setProgress((prev) => ({ ...prev, [os]: 100 }));
      const blob = new Blob(
        [`Nebula Desktop ${RELEASE.version} — simulated installer for ${os}.`],
        { type: "application/octet-stream" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setTimeout(() => setProgress((prev) => ({ ...prev, [os]: 0 })), 1400);
    }, 1900);
  }

  if (!ready || !user) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Verifying access…
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      <GridBackdrop />
      <CursorSpotlight />

      <header className="relative z-10 border-b border-border/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" /> Nebula Portal
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" /> System Operational
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">
              Welcome, <span className="text-foreground">{user.fullName}</span> ·{" "}
              {user.downloadCount} downloads
            </span>
            <GlowButton
              variant="outline"
              className="h-9 px-3 text-xs"
              onClick={() => {
                clearSession();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </GlowButton>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl space-y-10 px-6 py-12">
        <motion.section variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={riseIn}>
            <span className="font-mono text-[11px] tracking-widest text-accent uppercase">
              {RELEASE.tag}
            </span>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Nebula Desktop {RELEASE.version}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Signed release builds, {RELEASE.size} each. Verify the SHA-256 checksum after
              downloading. Minimum specs: 4-core CPU, 8 GB RAM, 2 GB free disk, GPU with Vulkan or
              Metal support.
            </p>
          </motion.div>

          <motion.div variants={riseIn} className="grid gap-4 md:grid-cols-3">
            {RELEASE.platforms.map((platform) => {
              const Icon = ICONS[platform.id];
              const value = progress[platform.id] ?? 0;
              return (
                <TiltCard key={platform.id} className="group p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {platform.ext}
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{platform.name}</h2>
                  <p className="mt-1 h-9 max-w-[22ch] text-xs text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {platform.compat}
                  </p>

                  <GlowButton
                    className="mt-4 w-full"
                    loading={value > 0 && value < 100}
                    onClick={() =>
                      startDownload(
                        platform.id,
                        `nebula-desktop-${RELEASE.version}-${platform.id}${platform.ext}`,
                      )
                    }
                  >
                    <Download className="h-4 w-4" /> Download
                  </GlowButton>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                    <motion.div
                      className="h-full bg-gradient-primary"
                      animate={{ width: `${value}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                  <p className="mt-3 truncate font-mono text-[10px] text-muted-foreground">
                    SHA-256 {platform.sha}
                  </p>
                </TiltCard>
              );
            })}
          </motion.div>
        </motion.section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Release changelog</h2>
          {CHANGELOG.map((entry) => {
            const open = openLog === entry.version;
            return (
              <GlassCard key={entry.version} glow={false} className="overflow-hidden">
                <button
                  onClick={() => setOpenLog(open ? null : entry.version)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-primary">{entry.version}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                    >
                      <ul className="space-y-2 px-5 pb-5 text-sm text-muted-foreground">
                        {entry.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </section>
      </div>
    </main>
  );
}

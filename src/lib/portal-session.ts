import type { PortalUser } from "./portal.functions";

const KEY = "portal.session.v1";

export function saveSession(user: PortalUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function readSession(): PortalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PortalUser) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export const RELEASE = {
  version: "v2.4.0",
  tag: "v2.4.0-LATEST",
  released: "Sep 2026",
  size: "148 MB",
  platforms: [
    {
      id: "windows" as const,
      name: "Windows",
      ext: ".exe",
      compat: "Windows 10 / 11 · x64 · 64-bit installer",
      sha: "9f2c41ab7d3e5c08b4a1de77c9f60e3b12ad884fe0c7b5a1d93e6f42ab77c105",
    },
    {
      id: "macos" as const,
      name: "macOS",
      ext: ".dmg",
      compat: "macOS 13+ · Apple Silicon & Intel universal",
      sha: "3ab77e01c95d42f8ba6c1e09d773fa25e8b04c61d95f2a7c30bb1e4f6690dc27",
    },
    {
      id: "linux" as const,
      name: "Linux",
      ext: ".AppImage",
      compat: "Ubuntu 22.04+ / Fedora 39+ · glibc 2.35 · x86_64",
      sha: "c70de1f4a9b825036ed4477fa1c9b0e56d3821fbc4a7d09e5b26fa3318cc94ab",
    },
  ],
};

export const CHANGELOG = [
  {
    version: "v2.4.0",
    date: "12 Sep 2026",
    items: [
      "Rebuilt render pipeline — 40% faster cold start on Windows.",
      "Native Apple Silicon build with hardened runtime notarization.",
      "New offline workspace sync with conflict resolution.",
    ],
  },
  {
    version: "v2.3.2",
    date: "28 Aug 2026",
    items: [
      "Fixed a rare crash when restoring multi-monitor layouts.",
      "Reduced idle memory footprint by 120 MB.",
    ],
  },
  {
    version: "v2.3.0",
    date: "05 Aug 2026",
    items: [
      "Introduced command palette with fuzzy project search.",
      "Signed Linux AppImage with delta auto-updates.",
      "Accessibility pass on all modal dialogs.",
    ],
  },
];

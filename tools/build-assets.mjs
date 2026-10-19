#!/usr/bin/env node
// Generates the static visual assets for the profile README.
// Everything is local SVG: no third-party image hosts, so the profile renders
// identically everywhere (including networks where shields.io / vercel are slow).
//
//   node tools/build-assets.mjs
//
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const BADGES = join(ASSETS, "badges");

const IDENTITY = {
  handle: "Gubao-tian",
  eyebrow: "STUDENT · DEVELOPER",
  tagline: "Building with Python and large language models.",
  site: "github.com/Gubao-tian",
};

const THEMES = {
  dark: {
    name: "dark",
    bg: ["#0b1020", "#141c2f"],
    grid: "#1e293b",
    gridOpacity: "0.35",
    panel: "#0d1526",
    panelStroke: "#243149",
    text: "#e6edf7",
    muted: "#8b9ab3",
    faint: "#5b6b85",
    accentA: "#22d3ee",
    accentB: "#a78bfa",
    orbA: "#7c3aed",
    orbB: "#0891b2",
    key: "#7dd3fc",
    value: "#e2e8f0",
  },
  light: {
    name: "light",
    bg: ["#f8fafc", "#eef2ff"],
    grid: "#dbe4f0",
    gridOpacity: "0.6",
    panel: "#ffffff",
    panelStroke: "#d8e1ef",
    text: "#0f1b2d",
    muted: "#5a6b85",
    faint: "#8798ae",
    accentA: "#0891b2",
    accentB: "#7c3aed",
    orbA: "#c4b5fd",
    orbB: "#a5f3fc",
    key: "#0e7490",
    value: "#1e293b",
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The hero banner: gradient backdrop, grid, glow orbs, identity block, terminal card. */
function hero(t) {
  const terminal = [
    ["$ whoami", "student / developer"],
    ["$ stack", "python · llm apps"],
    ["$ status", "learning in public"],
  ];

  const termLines = terminal
    .map(
      ([cmd, out], i) => `
      <text x="0" y="${24 + i * 46}" class="mono" font-size="15" fill="${t.faint}">${esc(cmd)}</text>
      <text x="0" y="${42 + i * 46}" class="mono" font-size="18" fill="${t.value}">${esc(out)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300" role="img" aria-label="${esc(
    IDENTITY.handle,
  )} — ${esc(IDENTITY.eyebrow)}. ${esc(IDENTITY.tagline)}">
  <defs>
    <linearGradient id="hbg" x1="0" y1="0" x2="1200" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.bg[0]}"/>
      <stop offset="1" stop-color="${t.bg[1]}"/>
    </linearGradient>
    <linearGradient id="haccent" x1="80" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.accentA}"/>
      <stop offset="1" stop-color="${t.accentB}"/>
    </linearGradient>
    <linearGradient id="hrule" x1="80" y1="0" x2="1120" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.accentA}" stop-opacity=".9"/>
      <stop offset=".55" stop-color="${t.accentB}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${t.accentB}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="hgrid" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M34 0H0V34" fill="none" stroke="${t.grid}" stroke-width="1"/>
    </pattern>
    <filter id="hglow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <clipPath id="hframe"><rect width="1200" height="300" rx="16"/></clipPath>
    <style>
      .mono { font-family: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace; }
      .sans { font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      .cursor { animation: blink 1.15s steps(1, end) infinite; }
      .orb-a { animation: drift 14s ease-in-out infinite; }
      .orb-b { animation: drift 18s ease-in-out infinite reverse; }
      .fade-in { animation: rise .9s ease-out both; }
      .d1 { animation-delay: .12s; }
      .d2 { animation-delay: .24s; }
      .d3 { animation-delay: .38s; }
      @keyframes blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
      @keyframes drift { 0%, 100% { transform: translate3d(0,0,0) } 50% { transform: translate3d(0,-14px,0) } }
      @keyframes rise { from { opacity: 0; transform: translate3d(0,10px,0) } to { opacity: 1; transform: translate3d(0,0,0) } }
      @media (prefers-reduced-motion: reduce) {
        .cursor, .orb-a, .orb-b, .fade-in { animation: none }
      }
    </style>
  </defs>

  <g clip-path="url(#hframe)">
    <rect width="1200" height="300" fill="url(#hbg)"/>
    <rect width="1200" height="300" fill="url(#hgrid)" opacity="${t.gridOpacity}"/>
    <circle class="orb-a" cx="1035" cy="36" r="170" fill="${t.orbA}" opacity="${t.name === "dark" ? 0.20 : 0.28}" filter="url(#hglow)"/>
    <circle class="orb-b" cx="95" cy="292" r="130" fill="${t.orbB}" opacity="${t.name === "dark" ? 0.16 : 0.22}" filter="url(#hglow)"/>

    <rect x="0" y="0" width="1200" height="3" fill="url(#hrule)"/>

    <g class="fade-in d1">
      <text x="80" y="86" class="mono" font-size="13.5" letter-spacing="4.8" fill="${t.muted}">${esc(
        IDENTITY.eyebrow,
      )}</text>
    </g>

    <g class="fade-in d2">
      <text x="78" y="160" class="sans" font-size="64" font-weight="800" letter-spacing="-1.4" fill="url(#haccent)">${esc(
        IDENTITY.handle,
      )}</text>
    </g>

    <g class="fade-in d3">
      <text x="80" y="202" class="sans" font-size="21" fill="${t.muted}">${esc(IDENTITY.tagline)}</text>
    </g>

    <g class="fade-in d3">
      <rect x="80" y="228" width="30" height="2" fill="${t.accentA}"/>
      <text x="80" y="262" class="mono" font-size="13" letter-spacing="1.6" fill="${t.faint}">${esc(
        IDENTITY.site,
      )}</text>
    </g>

    <g transform="translate(710 45)">
      <rect width="410" height="210" rx="12" fill="${t.panel}" stroke="${t.panelStroke}" stroke-width="1"/>
      <rect x="1" y="1" width="408" height="30" rx="11" fill="none" stroke="${t.panelStroke}" stroke-width="1" opacity=".7"/>
      <circle cx="21" cy="16" r="4.5" fill="#f87171" opacity=".85"/>
      <circle cx="38" cy="16" r="4.5" fill="#fbbf24" opacity=".85"/>
      <circle cx="55" cy="16" r="4.5" fill="#34d399" opacity=".85"/>
      <text x="80" y="21" class="mono" font-size="12" fill="${t.faint}">~/gubao-tian</text>
      <g transform="translate(24 56)">${termLines}
        <rect class="cursor" x="200" y="120" width="9" height="18" fill="${t.accentA}"/>
      </g>
    </g>
  </g>
</svg>
`;
}

/** A single flat badge: dark pill that reads fine on both README themes. */
function badge({ label, accent, width }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44" viewBox="0 0 ${width} 44" role="img" aria-label="${esc(
    label,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#111c30"/>
      <stop offset="1" stop-color="#0c1524"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="43" rx="10" fill="url(#bg)" stroke="#243149"/>
  <circle cx="20" cy="22" r="4.5" fill="${accent}"/>
  <text x="34" y="27" class="mono" font-size="13.5" letter-spacing="0.4" fill="#dbe4f2" font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace">${esc(
    label,
  )}</text>
</svg>
`;
}

const BADGE_DEFS = [
  { file: "python.svg", label: "Python", accent: "#4b8bbe", width: 132 },
  { file: "ai-llm.svg", label: "AI · LLM", accent: "#22d3ee", width: 138 },
  { file: "git.svg", label: "Git", accent: "#f05033", width: 108 },
];

function main() {
  mkdirSync(BADGES, { recursive: true });
  for (const theme of Object.values(THEMES)) {
    const out = join(ASSETS, `hero-${theme.name}.svg`);
    writeFileSync(out, hero(theme), "utf8");
    console.log("wrote", out);
  }
  for (const def of BADGE_DEFS) {
    const out = join(BADGES, def.file);
    writeFileSync(out, badge(def), "utf8");
    console.log("wrote", out);
  }
}

main();

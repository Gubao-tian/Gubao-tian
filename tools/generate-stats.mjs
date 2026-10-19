#!/usr/bin/env node
// Renders assets/stats-{dark,light}.svg from the GitHub GraphQL API.
// Runs in CI (see .github/workflows/profile-stats.yml); no third-party image
// hosting, so the cards load fast everywhere and match the README design.
//
//   GITHUB_TOKEN=... GH_LOGIN=Gubao-tian node tools/generate-stats.mjs
//
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets");

const LOGIN = process.env.GH_LOGIN || "Gubao-tian";
const TOKEN = process.env.GITHUB_TOKEN;

const THEMES = {
  dark: {
    bg: ["#0b1020", "#141c2f"],
    border: "#243149",
    text: "#e6edf7",
    muted: "#8b9ab3",
    faint: "#5b6b85",
    accentA: "#22d3ee",
    accentB: "#a78bfa",
    barBg: "#16203a",
  },
  light: {
    bg: ["#f8fafc", "#eef2ff"],
    border: "#d8e1ef",
    text: "#0f1b2d",
    muted: "#5a6b85",
    faint: "#8798ae",
    accentA: "#0891b2",
    accentB: "#7c3aed",
    barBg: "#e2e8f4",
  },
};

const QUERY = `
query ($login: String!) {
  user(login: $login) {
    createdAt
    followers { totalCount }
    repoTally: repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repoList: repositories(
      first: 100
      privacy: PUBLIC
      ownerAffiliations: OWNER
      isFork: false
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      nodes {
        name
        stargazerCount
        languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

async function fetchUser() {
  if (!TOKEN) throw new Error("GITHUB_TOKEN is required");
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "profile-stats" },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  if (!json.data?.user) throw new Error("user not found: " + LOGIN);
  return json.data.user;
}

function summarise(user) {
  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current += 1;
    else break;
  }

  const stars = user.repoList.nodes.reduce((n, r) => n + r.stargazerCount, 0);

  // The profile-README repo is tooling, not a project: keep its .mjs helpers
  // out of the language mix so the bar reflects real work.
  const projectRepos = user.repoList.nodes.filter((r) => r.name.toLowerCase() !== LOGIN.toLowerCase());

  const langs = new Map();
  for (const repo of projectRepos) {
    for (const { size, node } of repo.languages.edges) {
      const prev = langs.get(node.name) || { size: 0, color: node.color || "#8b9ab3" };
      langs.set(node.name, { size: prev.size + size, color: prev.color });
    }
  }
  const total = [...langs.values()].reduce((n, l) => n + l.size, 0) || 1;
  const top = [...langs.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 4)
    .map(([name, v]) => ({ name, color: v.color, pct: (v.size / total) * 100 }));

  return {
    contributions: user.contributionsCollection.contributionCalendar.totalContributions,
    followers: user.followers.totalCount,
    repos: user.repoTally.totalCount,
    stars,
    streak: current,
    longest,
    languages: top,
    since: new Date(user.createdAt).getUTCFullYear(),
  };
}

const METRICS = [
  ["contributions", "CONTRIBUTIONS", (s) => s.contributions],
  ["repositories", "REPOSITORIES", (s) => s.repos],
  ["stars", "STARS", (s) => s.stars],
  ["followers", "FOLLOWERS", (s) => s.followers],
];

function render(s, t) {
  const W = 880;
  const H = 212;
  const colW = (W - 80) / METRICS.length;

  const metrics = METRICS.map(([key, label, pick], i) => {
    const x = 40 + i * colW;
    const divider =
      i === 0
        ? ""
        : `<rect x="${x - 18}" y="56" width="1" height="64" fill="${t.text}" opacity=".10"/>`;
    return `${divider}
    <text x="${x}" y="110" font-size="44" font-weight="700" fill="${t.text}" font-family="ui-sans-serif, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">${pick(
      s,
    )}</text>
    <text x="${x}" y="136" font-size="11.5" letter-spacing="2.1" fill="${t.faint}" font-family="ui-monospace, Menlo, Consolas, monospace">${label}</text>`;
  }).join("");

  let bar = "";
  let legend = "";
  if (s.languages.length === 0) {
    legend = `<text x="40" y="186" font-size="11.5" fill="${t.faint}" font-family="ui-monospace, Menlo, Consolas, monospace">no languages yet — they appear as repositories land</text>`;
  } else {
    let x = 40;
    const barW = W - 80;
    const segs = s.languages.map((l) => {
      const w = Math.max(6, (l.pct / 100) * barW);
      const seg = `<rect x="${x.toFixed(2)}" y="158" width="${w.toFixed(2)}" height="8" fill="${l.color}"/>`;
      x += w;
      return seg;
    });
    bar = `<rect x="40" y="158" width="${barW}" height="8" rx="4" fill="${t.barBg}"/>
    <g clip-path="url(#barclip)">${segs.join("")}</g>`;
    let lx = 40;
    legend = s.languages
      .map((l) => {
        const label = `${l.name} ${l.pct.toFixed(1)}%`;
        const el = `<circle cx="${lx + 4}" cy="188" r="4" fill="${l.color}"/>
        <text x="${lx + 14}" y="192" font-size="11.5" fill="${t.muted}" font-family="ui-monospace, Menlo, Consolas, monospace">${escapeXml(
          label,
        )}</text>`;
        lx += 14 + label.length * 7.2 + 26;
        return el;
      })
      .join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub snapshot for ${escapeXml(
    LOGIN,
  )}: ${s.contributions} contributions, ${s.repos} repositories, ${s.stars} stars, ${s.followers} followers">
  <defs>
    <linearGradient id="sbg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.bg[0]}"/><stop offset="1" stop-color="${t.bg[1]}"/>
    </linearGradient>
    <linearGradient id="srule" x1="40" y1="0" x2="${W - 40}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.accentA}"/><stop offset="1" stop-color="${t.accentB}" stop-opacity=".2"/>
    </linearGradient>
    <clipPath id="sframe"><rect width="${W}" height="${H}" rx="14"/></clipPath>
    <clipPath id="barclip"><rect x="40" y="158" width="${W - 80}" height="8" rx="4"/></clipPath>
  </defs>
  <g clip-path="url(#sframe)">
    <rect width="${W}" height="${H}" fill="url(#sbg)"/>
    <rect width="${W}" height="2.5" fill="url(#srule)"/>
    <text x="40" y="42" font-size="10.5" letter-spacing="3.4" fill="${t.muted}" font-family="ui-monospace, Menlo, Consolas, monospace">GITHUB · SNAPSHOT · SINCE ${s.since}</text>
    <text x="${W - 40}" y="42" text-anchor="end" font-size="10.5" letter-spacing="2.6" fill="${t.faint}" font-family="ui-monospace, Menlo, Consolas, monospace">${escapeXml(
      LOGIN,
    )}</text>
    ${metrics}
    ${bar}
    ${legend}
  </g>
</svg>
`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
  const user = await fetchUser();
  const summary = summarise(user);
  mkdirSync(OUT, { recursive: true });
  for (const [name, theme] of Object.entries(THEMES)) {
    const file = join(OUT, `stats-${name}.svg`);
    writeFileSync(file, render(summary, theme), "utf8");
    console.log("wrote", file);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("failed:", err.message);
  process.exit(1);
});

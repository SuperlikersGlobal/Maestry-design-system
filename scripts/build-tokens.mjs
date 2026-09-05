#!/usr/bin/env node
// Reads tokens/*.json (source of truth) and emits framework-agnostic CSS
// custom properties + a flattened JSON under dist/. No runtime dependencies.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJSON = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));

const core = readJSON("tokens/core.json");
const verticals = readJSON("tokens/verticals.json");
const ranks = readJSON("tokens/ranks.json");
const dark = readJSON("tokens/themes/dark.json");
const light = readJSON("tokens/themes/light.json");

// Resolves "{color.ink.900}" against `core`.
function resolveRef(ref) {
  const path = ref.slice(1, -1).split(".");
  let node = core;
  for (const key of path) node = node[key];
  return typeof node === "object" && "value" in node ? node.value : node;
}
function resolveValue(v) {
  return typeof v === "string" && v.startsWith("{") && v.endsWith("}") ? resolveRef(v) : v;
}

function px(n) {
  return `${n}px`;
}

function buildCore() {
  const lines = [":root {"];
  lines.push("  /* Color · ink */");
  for (const [step, value] of Object.entries(core.color.ink)) {
    if (step.startsWith("$")) continue;
    lines.push(`  --ink-${step}: ${value};`);
  }
  lines.push("  --paper-50: var(--ink-0);");
  lines.push("");
  lines.push("  /* Color · gold */");
  for (const [step, value] of Object.entries(core.color.gold)) {
    if (step.startsWith("$")) continue;
    lines.push(`  --gold-${step}: ${value};`);
  }
  lines.push("");
  lines.push("  /* Color · purple */");
  for (const [step, value] of Object.entries(core.color.purple)) {
    if (step.startsWith("$")) continue;
    lines.push(`  --purple-${step}: ${value};`);
  }
  lines.push("");
  lines.push("  /* Color · semantic status */");
  for (const [name, def] of Object.entries(core.color.semantic)) {
    if (name.startsWith("$")) continue;
    lines.push(`  --status-${name}: ${def.value}; /* contraste ${def.contrastOnDark} sobre ink-900 */`);
  }
  lines.push("");
  lines.push("  /* Typography */");
  lines.push(`  --font-display: ${core.typography.fontFamily.display};`);
  lines.push(`  --font-ui: ${core.typography.fontFamily.ui};`);
  lines.push(`  --font-mono: ${core.typography.fontFamily.mono};`);
  for (const [token, spec] of Object.entries(core.typography.scale)) {
    if (token.startsWith("$")) continue;
    lines.push(`  --text-${token}-family: var(--font-${spec.fontFamily === "display" ? "display" : spec.fontFamily === "mono" ? "mono" : "ui"});`);
    lines.push(`  --text-${token}-weight: ${spec.fontWeight};`);
    lines.push(`  --text-${token}-size: ${px(spec.fontSize)};`);
    lines.push(`  --text-${token}-line-height: ${px(spec.lineHeight)};`);
    lines.push(`  --text-${token}-letter-spacing: ${spec.letterSpacing};`);
  }
  lines.push("");
  lines.push("  /* Spacing · base 4 */");
  for (const [token, value] of Object.entries(core.spacing)) {
    if (token.startsWith("$") || typeof value !== "number") continue;
    lines.push(`  --${token}: ${px(value)};`);
  }
  lines.push(`  --layout-mobile-margin: ${px(core.spacing.layout.mobileMargin)};`);
  lines.push(`  --layout-min-touch-target: ${px(core.spacing.layout.minTouchTarget)};`);
  lines.push("");
  lines.push("  /* Radius */");
  for (const [token, def] of Object.entries(core.radius)) {
    lines.push(`  --${token}: ${px(def.value)};`);
  }
  lines.push("");
  lines.push("  /* Elevation */");
  lines.push(`  --elev-0: ${core.elevation["elev-0"].boxShadow};`);
  lines.push(`  --elev-1: ${core.elevation["elev-1"].boxShadow};`);
  lines.push(`  --elev-2: ${core.elevation["elev-2"].boxShadow};`);
  lines.push(`  --elev-glow-border: ${core.elevation["elev-glow"].border};`);
  lines.push(`  --elev-glow-shadow: ${core.elevation["elev-glow"].boxShadow};`);
  lines.push("");
  lines.push("  /* Z-index */");
  for (const [token, value] of Object.entries(core.zIndex)) {
    if (token.startsWith("$")) continue;
    lines.push(`  --z-${token}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}

function buildTheme(themeName, theme) {
  const selector = themeName === "dark" ? ":root, [data-theme=\"dark\"]" : "[data-theme=\"light\"]";
  const lines = [`${selector} {`];
  for (const [token, def] of Object.entries(theme.semantic)) {
    if (typeof def !== "object" || def === null || !("value" in def)) continue;
    const value = resolveValue(def.value);
    lines.push(`  --${token}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}

function buildVerticals() {
  const lines = [];
  for (const [id, v] of Object.entries(verticals.verticals)) {
    lines.push(`[data-vertical="${id}"] {`);
    lines.push(`  --accent: ${v.accent};`);
    lines.push(`  --accent-light: ${v.accentLight};`);
    lines.push(`  --accent-soft: ${v.accentSoft};`);
    lines.push("}");
  }
  return lines.join("\n") + "\n";
}

function buildRanks() {
  const lines = [];
  for (const rank of ranks.ranks) {
    lines.push(`[data-rank="${rank.id}"] {`);
    lines.push(`  --rank-icon-color: ${rank.iconColor};`);
    lines.push(`  --rank-icon-bg: ${rank.iconBg};`);
    lines.push(`  --rank-icon-border: ${rank.iconBorder};`);
    if (rank.iconBorderStyle) lines.push(`  --rank-icon-border-style: ${rank.iconBorderStyle};`);
    lines.push("}");
  }
  return lines.join("\n") + "\n";
}

function stripMeta(obj) {
  if (Array.isArray(obj)) return obj.map(stripMeta);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("$")) continue;
      out[k] = stripMeta(v);
    }
    return out;
  }
  return obj;
}

mkdirSync(join(ROOT, "dist/css"), { recursive: true });
mkdirSync(join(ROOT, "dist/json"), { recursive: true });

writeFileSync(join(ROOT, "dist/css/core.css"), buildCore());
writeFileSync(join(ROOT, "dist/css/theme-dark.css"), buildTheme("dark", dark));
writeFileSync(join(ROOT, "dist/css/theme-light.css"), buildTheme("light", light));
writeFileSync(join(ROOT, "dist/css/verticals.css"), buildVerticals());
writeFileSync(join(ROOT, "dist/css/ranks.css"), buildRanks());

writeFileSync(
  join(ROOT, "dist/json/tokens.json"),
  JSON.stringify(
    {
      core: stripMeta(core),
      verticals: stripMeta(verticals),
      ranks: stripMeta(ranks),
      themes: { dark: stripMeta(dark), light: stripMeta(light) },
    },
    null,
    2
  ) + "\n"
);

console.log("Built dist/css/{core,theme-dark,theme-light,verticals,ranks}.css and dist/json/tokens.json");

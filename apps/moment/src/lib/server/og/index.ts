import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";

const W = 1200;
const H = 630;

// Resolved equivalents of the semantic light-theme tokens. The generated SVG is
// rendered outside the document, so browser CSS custom properties are unavailable.
const semantic = {
  background: "#faf8f3",
  card: "#fdfcfb",
  muted: "#eeebe4",
  foreground: "#1e1a14",
  mutedForeground: "#59554e",
} as const;

const font = {
  sans: '"Inter", "Noto Sans SC", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
  display: '"La Belle Aurore", "LXGW WenKai TC", cursive',
  kai: '"LXGW WenKai TC", "Noto Sans SC", "PingFang SC", sans-serif',
} as const;

const PILES: [number, number, number, number, number][][] = [
  [],
  [[900, 315, 500, 500, 2]],
  [
    [790, 300, 300, 400, -7],
    [1010, 335, 300, 400, 6],
  ],
  [
    [765, 300, 280, 372, -10],
    [1040, 332, 280, 372, 9],
    [902, 318, 312, 414, -2],
  ],
];

const SHADOW = `<filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#3a2f1c" flood-opacity="0.2" /></filter>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface OgDot {
  x: number;
  y: number;
  color: string;
}

export interface OgImageOptions {
  title: string;
  subtitle: string;
  logo: string;
  images: string[];
  dots: OgDot[];
}

export function renderOgImage(options: OgImageOptions): string {
  const images = options.images.slice(0, 3);
  const pile = PILES[images.length];
  const dots = options.dots
    .map(
      (dot) =>
        `<circle cx="${dot.x}" cy="${dot.y}" r="5" fill="${dot.color}" stroke="#ffffff" stroke-width="1.5" />`,
    )
    .join("");
  const cards = pile.map(([cx, cy, w, h, tilt], i) => {
    const front = i === pile.length - 1;
    const box = `x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}"`;
    return `<g transform="rotate(${tilt} ${cx} ${cy})" filter="url(#shadow)">
      <clipPath id="card${i}"><rect ${box} rx="22" /></clipPath>
      <rect ${box} rx="22" fill="${semantic.muted}" />
      <g clip-path="url(#card${i})">
        <image href="${esc(images[front ? 0 : i + 1])}" ${box} preserveAspectRatio="xMidYMid slice" />
        <g transform="translate(${cx - w / 2} ${cy - h / 2})">${front ? dots : ""}</g>
      </g>
      <rect ${box} rx="22" fill="none" stroke="${semantic.card}" stroke-width="6" />
    </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${SHADOW}</defs>
    <rect width="${W}" height="${H}" fill="${semantic.background}" />
    <clipPath id="logo"><circle cx="96" cy="92" r="24" /></clipPath>
    <image href="${esc(options.logo)}" x="72" y="68" width="48" height="48" clip-path="url(#logo)" preserveAspectRatio="xMidYMid slice" />
    <text x="136" y="100" font-family="${esc(font.sans)}" font-size="23" fill="${semantic.foreground}">My Moment</text>
    <text x="68" y="418" font-family="${esc(font.display)}" font-size="132" fill="${semantic.foreground}">${esc(options.title)}</text>
    <text x="72" y="562" font-family="${esc(font.sans)}" font-size="26" fill="${semantic.mutedForeground}">${esc(options.subtitle)}</text>
    ${cards.join("\n    ")}
  </svg>`;
}

export interface OgPhotoOptions {
  title: string;
  meta: string;
  logo: string;
  image: string;
  ratio: number;
}

export function renderOgPhoto(options: OgPhotoOptions): string {
  const w = Math.min(620, 480 * options.ratio);
  const h = w / options.ratio;
  const cx = 1150 - w / 2 - 20;
  const box = `x="${cx - w / 2}" y="${315 - h / 2}" width="${w}" height="${h}"`;
  const chars = Array.from(options.title.replace(/\s+/g, " ").trim());
  const size = chars.length <= 6 ? 76 : chars.length <= 12 ? 60 : 48;
  const budget = (cx - w / 2 - 72 - 44) / size;
  const lines: string[] = [];
  let line = "";
  let width = 0;
  for (const ch of chars) {
    const wide = /[\u2e80-\uffef]/.test(ch) ? 1 : 0.55;
    if (width + wide > budget && line) {
      lines.push(line);
      line = "";
      width = 0;
    }
    line += ch;
    width += wide;
  }
  lines.push(line);
  const shown = lines.slice(0, 3);
  if (lines.length > 3) shown[2] = `${shown[2].slice(0, -1)}…`;
  const lineHeight = size * 1.28;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${SHADOW}</defs>
    <rect width="${W}" height="${H}" fill="${semantic.background}" />
    <clipPath id="logo"><circle cx="96" cy="92" r="24" /></clipPath>
    <image href="${esc(options.logo)}" x="72" y="68" width="48" height="48" clip-path="url(#logo)" preserveAspectRatio="xMidYMid slice" />
    <text x="136" y="100" font-family="${esc(font.sans)}" font-size="23" fill="${semantic.foreground}">My Moment</text>
    ${shown
      .map(
        (text, i) =>
          `<text x="72" y="${486 - (shown.length - 1 - i) * lineHeight}" font-family="${esc(font.kai)}" font-size="${size}" fill="${semantic.foreground}">${esc(text)}</text>`,
      )
      .join("\n    ")}
    <text x="72" y="548" font-family="${esc(font.sans)}" font-size="24" fill="${semantic.mutedForeground}">${esc(options.meta)}</text>
    <g transform="rotate(-2 ${cx} 315)" filter="url(#shadow)">
      <clipPath id="photo"><rect ${box} rx="22" /></clipPath>
      <rect ${box} rx="22" fill="${semantic.muted}" />
      <image href="${esc(options.image)}" ${box} clip-path="url(#photo)" preserveAspectRatio="xMidYMid slice" />
      <rect ${box} rx="22" fill="none" stroke="${semantic.card}" stroke-width="6" />
    </g>
  </svg>`;
}

let wasmReady: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  wasmReady ??= (async () => {
    const { default: wasmModule } = await import("@resvg/resvg-wasm/index_bg.wasm");
    await initWasm(wasmModule);
  })().catch((err) => {
    wasmReady = null;
    throw err;
  });
  await wasmReady;
}

function extractText(svg: string): string {
  let text = "";
  for (const match of svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)) {
    text += match[1];
  }
  return text;
}

export async function renderOgPng(svg: string, kv: KVNamespace): Promise<ArrayBuffer> {
  await ensureWasm();

  const fontBuffers = await loadOgFonts(extractText(svg), kv);

  const resvg = new Resvg(svg, {
    background: semantic.background,
    fitTo: { mode: "width", value: W },
    font: {
      fontBuffers,
      defaultFontFamily: OG_FONT_FAMILIES.sans,
      sansSerifFamily: OG_FONT_FAMILIES.sans,
      serifFamily: OG_FONT_FAMILIES.display,
    },
  });

  const image = resvg.render();
  try {
    const png = image.asPng();
    return new Uint8Array(png).buffer;
  } finally {
    image.free();
    resvg.free();
  }
}

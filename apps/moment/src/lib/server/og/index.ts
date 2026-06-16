import type { KVNamespace } from "@cloudflare/workers-types";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";

const W = 1200;
const H = 630;

const light = {
  paper: "#faf7eb",
  cloud: "#f5f2ec",
  oat: "#e8e0d0",
  fog: "#726e69",
  ink: "#1a1a1a",
} as const;

const brand = "#6366f1"; // Indigo accent

const font = {
  sans: '"Geist", "Inter", system-ui, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  serif: '"Lora", "Noto Serif SC", "Source Han Serif SC", Georgia, serif',
  mono: '"Geist Mono", "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isWideChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6)
  );
}

function wrapText(
  text: string,
  maxWidth: number,
  firstSize: number,
  restSize: number,
  maxLines: number,
): string[] {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());

  const fill = (budget: number): string[] => {
    const lines: string[] = [];
    let line: string[] = [];
    let width = 0;
    const charWidth = (ch: string) => {
      const size = lines.length === 0 ? firstSize : restSize;
      return isWideChar(ch) ? size : size * 0.6;
    };

    for (const ch of chars) {
      if (width + charWidth(ch) > budget && line.length > 0) {
        const lastSpace = line.lastIndexOf(" ");
        const carried = lastSpace > 0 ? line.slice(lastSpace + 1) : [];
        lines.push(line.slice(0, lastSpace > 0 ? lastSpace : line.length).join(""));
        line = carried;
        width = line.reduce((sum, c) => sum + charWidth(c), 0);
        if (lines.length >= maxLines) {
          line = [];
          break;
        }
      }
      line.push(ch);
      width += charWidth(ch);
    }

    if (line.length > 0 && lines.length < maxLines) lines.push(line.join(""));
    return lines.length > 0 ? lines : [""];
  };

  const greedy = fill(maxWidth);
  if (greedy.length < 2) return greedy;

  let low = 0;
  let high = maxWidth;
  let best = greedy;
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    const candidate = fill(mid);
    if (candidate.length <= greedy.length) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }
  return best;
}

function txt(
  text: string,
  o: {
    x: number;
    y: number;
    ff: string;
    fs: number;
    fw: number;
    fill: string;
    opacity?: number;
    ls?: string;
    tt?: string;
    anchor?: "start" | "middle" | "end";
  },
): string {
  const a = [
    `x="${o.x}"`,
    `y="${o.y}"`,
    `font-family="${o.ff.replace(/"/g, "&quot;")}"`,
    `font-size="${o.fs}"`,
    `font-weight="${o.fw}"`,
    `fill="${o.fill}"`,
    o.opacity != null ? `opacity="${o.opacity}"` : "",
    o.ls ? `letter-spacing="${o.ls}"` : "",
    o.tt ? `text-transform="${o.tt}"` : "",
    o.anchor ? `text-anchor="${o.anchor}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<text ${a}>${esc(text)}</text>`;
}

function bg(): string {
  return `
    <rect width="${W}" height="${H}" fill="${light.paper}" />
    <defs>
      <radialGradient id="glow" cx="85%" cy="15%" r="55%">
        <stop offset="0%" stop-color="${brand}" stop-opacity="0.06" />
        <stop offset="100%" stop-color="${light.paper}" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${light.oat}" stroke-width="0.5" stroke-opacity="0.35" />
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#glow)" />
    <rect width="${W}" height="${H}" fill="url(#grid)" />
    <circle cx="1120" cy="560" r="3" fill="${brand}" opacity="0.15" />
    <circle cx="1136" cy="548" r="2" fill="${brand}" opacity="0.10" />
    <circle cx="1148" cy="564" r="2.5" fill="${brand}" opacity="0.12" />
    <rect x="0" y="0" width="180" height="3" fill="${brand}" />
  `;
}

export interface OgImageOptions {
  title: string;
  subtitle?: string;
  domain?: string;
  date?: string | null;
  siteName?: string;
  type?: "photo" | "haul" | "wish" | "default";
}

export function renderOgImage(options: OgImageOptions): string {
  const {
    title,
    subtitle,
    domain = "my-moment.pages.dev",
    date = null,
    siteName = "My Moment",
    type = "default",
  } = options;

  const contentLines = wrapText(title, 890, 36, 28, 4);
  const hasSubtitle = !!subtitle;

  const CARD_L = 120;
  const CARD_R = 1080;
  const CARD_T = 70;
  const CARD_B = 560;
  const ID_Y = 120;
  const FOOT_Y = 542;
  const FOOT_SEP_Y = 526;

  const CLH = 46;
  const CHF = 48;
  const CH = CLH * (contentLines.length - 1) + CHF;
  const SUBTITLE_H = hasSubtitle ? 32 : 0;
  const blockH = CH + SUBTITLE_H;

  const availTop = ID_Y + 44;
  const availBtm = FOOT_SEP_Y - 16;
  const availH = availBtm - availTop;
  const blockY0 = availTop + Math.max(0, (availH - blockH) / 2);

  const barTop = ID_Y - 28;
  const barH = FOOT_SEP_Y - barTop;

  const cardH = CARD_B - CARD_T;

  const typeEmoji: Record<string, string> = {
    photo: "📷",
    haul: "🛍️",
    wish: "💝",
    default: "✨",
  };

  const parts: string[] = [];

  parts.push(
    `<rect x="${CARD_L}" y="${CARD_T}" width="${CARD_R - CARD_L}" height="${cardH}" rx="10" fill="${light.cloud}" stroke="${light.oat}" stroke-width="1" />`,
  );
  parts.push(`
    <defs>
      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${brand}" />
        <stop offset="100%" stop-color="${brand}" stop-opacity="0.12" />
      </linearGradient>
    </defs>
    <rect x="${CARD_L + 16}" y="${barTop}" width="3" height="${barH}" rx="1.5" fill="url(#bar)" />
  `);

  parts.push(`
    ${txt(typeEmoji[type] || "✨", { x: CARD_L + 16 + 12, y: ID_Y, ff: font.sans, fs: 24, fw: 400, fill: light.ink })}
    ${txt(siteName, { x: CARD_L + 16 + 46, y: ID_Y, ff: font.sans, fs: 22, fw: 600, fill: light.ink })}
  `);

  contentLines.forEach((line, i) => {
    const y = blockY0 + (i === 0 ? 0 : CHF + (i - 1) * CLH);
    parts.push(
      txt(line, {
        x: CARD_L + 30,
        y,
        ff: i === 0 ? font.serif : font.sans,
        fs: i === 0 ? 36 : 28,
        fw: i === 0 ? 600 : 400,
        fill: i === 0 ? light.ink : light.fog,
      }),
    );
  });

  if (hasSubtitle) {
    const subtitleY = blockY0 + CH + 8;
    parts.push(
      txt(subtitle, {
        x: CARD_L + 30,
        y: subtitleY,
        ff: font.sans,
        fs: 18,
        fw: 400,
        fill: light.fog,
        opacity: 0.7,
      }),
    );
  }

  parts.push(
    `<line x1="${CARD_L + 20}" y1="${FOOT_SEP_Y}" x2="${CARD_R}" y2="${FOOT_SEP_Y}" stroke="${light.oat}" stroke-width="1" />`,
  );
  parts.push(
    txt(domain, {
      x: CARD_L + 20,
      y: FOOT_Y,
      ff: font.mono,
      fs: 13,
      fw: 400,
      fill: light.fog,
      opacity: 0.6,
      ls: "0.05em",
      tt: "uppercase",
    }),
  );
  if (date) {
    parts.push(
      txt(date, {
        x: CARD_R,
        y: FOOT_Y,
        ff: font.mono,
        fs: 13,
        fw: 400,
        fill: light.fog,
        opacity: 0.5,
        anchor: "end",
      }),
    );
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    bg(),
    ...parts,
    `</svg>`,
  ].join("\n");
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
    background: light.paper,
    fitTo: { mode: "width", value: W },
    font: {
      fontBuffers,
      defaultFontFamily: OG_FONT_FAMILIES.sans,
      sansSerifFamily: OG_FONT_FAMILIES.sans,
      serifFamily: OG_FONT_FAMILIES.serif,
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

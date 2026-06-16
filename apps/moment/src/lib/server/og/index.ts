import type { KVNamespace } from "@cloudflare/workers-types";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";

const W = 1200;
const H = 630;

const light = {
  paper: "#faf7ee",
  card: "#fffdf7",
  oat: "#e6dfd1",
  fog: "#756f66",
  ink: "#2c2823",
} as const;

const gold = {
  deep: "#b7872c",
  mid: "#cf9e34",
  bright: "#e7c46a",
  tint: "#f4e8c8",
} as const;

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
    <defs>
      <radialGradient id="wash" cx="78%" cy="12%" r="70%">
        <stop offset="0%" stop-color="${gold.bright}" stop-opacity="0.14" />
        <stop offset="60%" stop-color="${gold.tint}" stop-opacity="0.05" />
        <stop offset="100%" stop-color="${light.paper}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${light.paper}" />
    <rect width="${W}" height="${H}" fill="url(#wash)" />
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

const typeMeta: Record<string, { emoji: string; kicker: string }> = {
  photo: { emoji: "📷", kicker: "Captured Moments" },
  haul: { emoji: "🛍️", kicker: "Things I Bought" },
  wish: { emoji: "💝", kicker: "Saved For Later" },
  default: { emoji: "✨", kicker: "Collection" },
};

export function renderOgImage(options: OgImageOptions): string {
  const {
    title,
    subtitle,
    domain = "my-moment.pages.dev",
    date = null,
    siteName = "My Moment",
    type = "default",
  } = options;

  const meta = typeMeta[type] || typeMeta.default;

  const FRAME = { x: 44, y: 44, w: W - 88, h: H - 88, rx: 28 };
  const X = 100;
  const R = W - 100;

  const len = Array.from(title).length;
  const titleSize = len <= 8 ? 112 : len <= 16 ? 82 : len <= 28 ? 60 : 46;
  const lines = wrapText(title, R - X, titleSize, titleSize, 3);
  const lineH = titleSize * 1.06;

  const countMatch = subtitle?.match(/^\s*([\d.,]+)\s+(.+)$/);

  const parts: string[] = [];

  parts.push(`
    <defs>
      <linearGradient id="frameEdge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${gold.mid}" stop-opacity="0.5" />
        <stop offset="100%" stop-color="${light.oat}" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <rect x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" rx="${FRAME.rx}"
      fill="${light.card}" stroke="url(#frameEdge)" stroke-width="1.5" />
  `);

  const brandY = 120;
  parts.push(
    `<rect x="${X}" y="${brandY - 12}" width="30" height="5" rx="2.5" fill="${gold.mid}" />`,
  );
  parts.push(
    txt(siteName.toUpperCase(), {
      x: X + 46,
      y: brandY,
      ff: font.mono,
      fs: 22,
      fw: 500,
      fill: light.ink,
      opacity: 0.72,
      ls: "0.22em",
    }),
  );

  const badge = { cx: R - 40, cy: 110, r: 40 };
  parts.push(
    `<circle cx="${badge.cx}" cy="${badge.cy}" r="${badge.r}" fill="${gold.tint}" stroke="${gold.mid}" stroke-width="1.5" stroke-opacity="0.55" />`,
  );
  parts.push(
    txt(meta.emoji, {
      x: badge.cx,
      y: badge.cy + 15,
      ff: font.sans,
      fs: 40,
      fw: 400,
      fill: light.ink,
      anchor: "middle",
    }),
  );

  const kickerY = 258;
  parts.push(
    txt(meta.kicker.toUpperCase(), {
      x: X,
      y: kickerY,
      ff: font.sans,
      fs: 22,
      fw: 600,
      fill: gold.deep,
      ls: "0.16em",
    }),
  );

  const firstBaseline = 352;
  lines.forEach((line, i) => {
    parts.push(
      txt(line, {
        x: X,
        y: firstBaseline + i * lineH,
        ff: font.serif,
        fs: titleSize,
        fw: 600,
        fill: light.ink,
      }),
    );
  });

  const countY = firstBaseline + (lines.length - 1) * lineH + 78;
  if (countMatch) {
    const [, num, label] = countMatch;
    parts.push(txt(num, { x: X, y: countY, ff: font.serif, fs: 58, fw: 600, fill: gold.deep }));
    const numW = Array.from(num).length * 58 * 0.56;
    parts.push(
      txt(label.toUpperCase(), {
        x: X + numW + 18,
        y: countY - 6,
        ff: font.sans,
        fs: 26,
        fw: 500,
        fill: light.fog,
        ls: "0.12em",
      }),
    );
  } else if (subtitle) {
    parts.push(txt(subtitle, { x: X, y: countY, ff: font.sans, fs: 32, fw: 400, fill: light.fog }));
  }

  const footY = 524;
  parts.push(
    `<line x1="${X}" y1="${footY - 26}" x2="${R}" y2="${footY - 26}" stroke="${light.oat}" stroke-width="1" />`,
  );
  parts.push(
    txt(domain, {
      x: X,
      y: footY,
      ff: font.mono,
      fs: 15,
      fw: 400,
      fill: light.fog,
      opacity: 0.75,
      ls: "0.06em",
      tt: "uppercase",
    }),
  );
  if (date) {
    parts.push(
      txt(date, {
        x: R,
        y: footY,
        ff: font.mono,
        fs: 15,
        fw: 400,
        fill: light.fog,
        opacity: 0.6,
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

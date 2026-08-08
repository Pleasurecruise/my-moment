import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";

const W = 1200;
const H = 630;

// Resolved equivalents of the semantic light-theme tokens. The generated SVG is
// rendered outside the document, so browser CSS custom properties are unavailable.
const semantic = {
  background: "#faf9f5",
  card: "#fffefa",
  foreground: "#2d2a26",
  mutedForeground: "#6e6962",
  border: "#dedbd4",
  primary: "#dfc35e",
} as const;

const font = {
  sans: '"Inter", "Noto Sans SC", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
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

export interface OgImageOptions {
  title: string;
  subtitle?: string;
  domain?: string;
  date?: string | null;
  siteName?: string;
  logoDataUrl?: string;
  type?: "photo" | "haul" | "wish" | "journey" | "guestbook" | "default";
}

const typeMeta: Record<string, { code: string; kicker: string }> = {
  photo: { code: "GA", kicker: "Photographic archive" },
  haul: { code: "CO", kicker: "Objects & observations" },
  wish: { code: "WI", kicker: "Things worth remembering" },
  journey: { code: "JR", kicker: "Places & memory" },
  guestbook: { code: "GB", kicker: "Notes from visitors" },
  default: { code: "AR", kicker: "Personal archive" },
};

export function renderOgImage(options: OgImageOptions): string {
  const {
    title,
    subtitle,
    domain = "my-moment.pages.dev",
    date = null,
    siteName = "My Moment",
    logoDataUrl,
    type = "default",
  } = options;

  const meta = typeMeta[type] || typeMeta.default;

  const X = 72;
  const PANEL_X = 830;
  const CONTENT_R = PANEL_X - 72;

  const len = Array.from(title).length;
  const titleSize = len <= 9 ? 94 : len <= 18 ? 76 : len <= 32 ? 60 : 48;
  const lines = wrapText(title, CONTENT_R - X, titleSize, titleSize, 3);
  const lineH = titleSize * 1.02;

  const parts: string[] = [];

  parts.push(`
    <rect width="${W}" height="${H}" fill="${semantic.background}" />
    <rect x="${PANEL_X + 34}" y="62" width="302" height="506" rx="18"
      fill="${semantic.card}" stroke="${semantic.border}" stroke-width="1.5" />
    <line x1="${X}" y1="108" x2="${CONTENT_R}" y2="108" stroke="${semantic.border}" stroke-width="1.5" />
  `);

  parts.push(
    txt(siteName.toUpperCase(), {
      x: X,
      y: 82,
      ff: font.sans,
      fs: 19,
      fw: 600,
      fill: semantic.foreground,
      ls: "0.04em",
    }),
  );
  parts.push(
    txt("A PERSONAL INDEX", {
      x: CONTENT_R,
      y: 82,
      ff: font.mono,
      fs: 13,
      fw: 400,
      fill: semantic.mutedForeground,
      ls: "0.04em",
      anchor: "end",
    }),
  );

  parts.push(`<rect x="${X}" y="156" width="42" height="5" rx="2.5" fill="${semantic.primary}" />`);
  parts.push(
    txt(meta.kicker.toUpperCase(), {
      x: X,
      y: 194,
      ff: font.sans,
      fs: 15,
      fw: 500,
      fill: semantic.mutedForeground,
      ls: "0.04em",
    }),
  );

  const firstBaseline = 316;
  lines.forEach((line, i) => {
    parts.push(
      txt(line, {
        x: X,
        y: firstBaseline + i * lineH,
        ff: font.sans,
        fs: titleSize,
        fw: 600,
        fill: semantic.foreground,
        ls: "-0.02em",
      }),
    );
  });

  if (subtitle) {
    const subtitleY = Math.max(466, firstBaseline + lines.length * lineH + 34);
    parts.push(
      txt(subtitle, {
        x: X,
        y: Math.min(subtitleY, 500),
        ff: font.sans,
        fs: 23,
        fw: 400,
        fill: semantic.mutedForeground,
      }),
    );
  }

  parts.push(
    txt(meta.code, {
      x: PANEL_X + 66,
      y: 98,
      ff: font.mono,
      fs: 14,
      fw: 500,
      fill: semantic.mutedForeground,
      ls: "0.04em",
    }),
  );
  if (logoDataUrl) {
    parts.push(
      `<image href="${esc(logoDataUrl)}" x="894" y="138" width="244" height="244" preserveAspectRatio="xMidYMid meet" />`,
    );
  } else {
    parts.push(
      txt("M", {
        x: PANEL_X + 185,
        y: 354,
        ff: font.sans,
        fs: 220,
        fw: 600,
        fill: semantic.foreground,
        anchor: "middle",
      }),
    );
  }
  parts.push(
    txt("MY MOMENT", {
      x: PANEL_X + 185,
      y: 448,
      ff: font.sans,
      fs: 18,
      fw: 600,
      fill: semantic.foreground,
      ls: "0.04em",
      anchor: "middle",
    }),
  );
  parts.push(
    txt("PERSONAL ARCHIVE", {
      x: PANEL_X + 185,
      y: 478,
      ff: font.mono,
      fs: 12,
      fw: 400,
      fill: semantic.mutedForeground,
      ls: "0.04em",
      anchor: "middle",
    }),
  );

  parts.push(
    `<line x1="${X}" y1="558" x2="${CONTENT_R}" y2="558" stroke="${semantic.border}" stroke-width="1" />`,
  );
  parts.push(
    txt(domain, {
      x: X,
      y: 588,
      ff: font.mono,
      fs: 14,
      fw: 400,
      fill: semantic.mutedForeground,
      ls: "0.05em",
    }),
  );
  if (date) {
    parts.push(
      txt(date, {
        x: CONTENT_R,
        y: 588,
        ff: font.mono,
        fs: 14,
        fw: 400,
        fill: semantic.mutedForeground,
        anchor: "end",
      }),
    );
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
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
    background: semantic.background,
    fitTo: { mode: "width", value: W },
    font: {
      fontBuffers,
      defaultFontFamily: OG_FONT_FAMILIES.sans,
      sansSerifFamily: OG_FONT_FAMILIES.sans,
      serifFamily: OG_FONT_FAMILIES.sans,
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

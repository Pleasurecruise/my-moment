import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";

const W = 1200;
const H = 630;

// Resolved equivalents of the semantic light-theme tokens. The generated SVG is
// rendered outside the document, so browser CSS custom properties are unavailable.
const semantic = {
  background: "#f4f0e7",
  card: "#fffdf8",
  foreground: "#20211e",
  mutedForeground: "#716f68",
  border: "#d9d3c7",
  primary: "#e7ad45",
} as const;

const font = {
  sans: '"Inter", "Noto Sans SC", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
  display: '"Noto Serif SC", Georgia, "Songti SC", serif',
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

const BRAND_ACCENT = "#df9c45";

const typeMeta: Record<string, { code: string; kicker: string }> = {
  photo: { code: "01", kicker: "Photo journal" },
  haul: { code: "02", kicker: "Collected things" },
  wish: { code: "03", kicker: "Wish list" },
  journey: { code: "04", kicker: "Travel notes" },
  guestbook: { code: "05", kicker: "Guestbook" },
  default: { code: "00", kicker: "Personal archive" },
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

  const X = 68;
  const CONTENT_R = 746;
  const len = Array.from(title).length;
  const titleSize = len <= 11 ? 90 : len <= 22 ? 76 : len <= 36 ? 62 : 52;
  const lines = wrapText(title, CONTENT_R - X, titleSize, titleSize, 3);
  const lineH = titleSize * 1.02;
  const firstBaseline = lines.length === 1 ? 337 : lines.length === 2 ? 294 : 249;
  const parts: string[] = [];

  parts.push(`
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8f5ee" />
        <stop offset="1" stop-color="${semantic.background}" />
      </linearGradient>
      <clipPath id="portrait"><rect x="838" y="91" width="266" height="329" rx="18" /></clipPath>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#paper)" />
    <circle cx="1110" cy="-48" r="258" fill="${BRAND_ACCENT}" opacity="0.1" />
    <circle cx="1091" cy="-42" r="199" fill="none" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.18" />
    <path d="M0 533 C190 475 360 596 564 538 S938 458 1200 527 L1200 630 L0 630 Z" fill="${BRAND_ACCENT}" opacity="0.04" />
    <path d="M26 576 C213 507 370 622 575 565 S945 490 1191 548" fill="none" stroke="${BRAND_ACCENT}" stroke-width="2" opacity="0.13" />
    <rect x="818" y="61" width="326" height="510" rx="28" fill="${BRAND_ACCENT}" opacity="0.17" transform="rotate(3 981 316)" />
    <rect x="802" y="52" width="334" height="522" rx="28" fill="${semantic.card}" stroke="${semantic.border}" stroke-width="1.5" />
  `);

  parts.push(`<circle cx="${X + 6}" cy="74" r="6" fill="${BRAND_ACCENT}" />`);
  parts.push(
    txt(siteName.toUpperCase(), {
      x: X + 24,
      y: 81,
      ff: font.display,
      fs: 18,
      fw: 650,
      fill: semantic.foreground,
      ls: "0.08em",
    }),
  );
  parts.push(
    txt("PRIVATE NOTES · " + meta.code, {
      x: CONTENT_R,
      y: 80,
      ff: font.mono,
      fs: 13,
      fw: 500,
      fill: semantic.mutedForeground,
      ls: "0.05em",
      anchor: "end",
    }),
  );
  parts.push(`<line x1="${X}" y1="109" x2="${CONTENT_R}" y2="109" stroke="${semantic.border}" />`);

  parts.push(
    `<rect x="${X}" y="153" width="${Math.max(130, meta.kicker.length * 10 + 34)}" height="36" rx="18" fill="${BRAND_ACCENT}" opacity="0.13" />`,
  );
  parts.push(
    txt(meta.kicker.toUpperCase(), {
      x: X + 17,
      y: 177,
      ff: font.sans,
      fs: 14,
      fw: 650,
      fill: BRAND_ACCENT,
      ls: "0.07em",
    }),
  );

  lines.forEach((line, i) => {
    parts.push(
      txt(line, {
        x: X,
        y: firstBaseline + i * lineH,
        ff: font.display,
        fs: titleSize,
        fw: 650,
        fill: semantic.foreground,
        ls: "-0.035em",
      }),
    );
  });

  if (subtitle) {
    parts.push(
      txt(subtitle, {
        x: X,
        y: 505,
        ff: font.sans,
        fs: 22,
        fw: 400,
        fill: semantic.mutedForeground,
      }),
    );
  }
  parts.push(`<line x1="${X}" y1="549" x2="${CONTENT_R}" y2="549" stroke="${semantic.border}" />`);
  parts.push(
    txt(domain, {
      x: X,
      y: 583,
      ff: font.mono,
      fs: 14,
      fw: 500,
      fill: semantic.mutedForeground,
      ls: "0.04em",
    }),
  );
  parts.push(
    txt(date || "KEEPING THE SMALL THINGS", {
      x: CONTENT_R,
      y: 583,
      ff: font.mono,
      fs: 12,
      fw: 500,
      fill: semantic.mutedForeground,
      ls: "0.05em",
      anchor: "end",
    }),
  );

  parts.push(`<rect x="838" y="91" width="266" height="329" rx="18" fill="#eee8dc" />`);
  if (logoDataUrl) {
    parts.push(
      `<image href="${esc(logoDataUrl)}" x="838" y="91" width="266" height="329" clip-path="url(#portrait)" preserveAspectRatio="xMidYMid slice" />`,
    );
  } else {
    parts.push(
      txt("M", {
        x: 971,
        y: 314,
        ff: font.sans,
        fs: 190,
        fw: 650,
        fill: BRAND_ACCENT,
        anchor: "middle",
      }),
    );
  }
  parts.push(`<circle cx="851" cy="446" r="5" fill="${BRAND_ACCENT}" />`);
  parts.push(
    txt(meta.kicker, {
      x: 869,
      y: 452,
      ff: font.sans,
      fs: 15,
      fw: 600,
      fill: semantic.foreground,
    }),
  );
  parts.push(
    txt("A quiet place for moments, places,", {
      x: 838,
      y: 499,
      ff: font.sans,
      fs: 14,
      fw: 400,
      fill: semantic.mutedForeground,
    }),
  );
  parts.push(
    txt("and the things worth remembering.", {
      x: 838,
      y: 522,
      ff: font.sans,
      fs: 14,
      fw: 400,
      fill: semantic.mutedForeground,
    }),
  );
  parts.push(`<line x1="838" y1="544" x2="1104" y2="544" stroke="${semantic.border}" />`);
  parts.push(
    txt("MY MOMENT", {
      x: 1104,
      y: 561,
      ff: font.mono,
      fs: 11,
      fw: 600,
      fill: semantic.mutedForeground,
      ls: "0.08em",
      anchor: "end",
    }),
  );

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

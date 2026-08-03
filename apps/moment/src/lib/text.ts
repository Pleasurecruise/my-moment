export type TextLinkPart = { type: "text"; value: string } | { type: "link"; value: string };

const WEB_LINK_PATTERN = /https?:\/\/[^\s<>"'，。！？；：、）】》]+/gi;
const TRAILING_LINK_PUNCTUATION = /[.,!?;:，。！？；：、)\]}】》]+$/;

export function splitTextLinks(value: string): TextLinkPart[] {
  const parts: TextLinkPart[] = [];
  let cursor = 0;

  for (const match of value.matchAll(WEB_LINK_PATTERN)) {
    const index = match.index;
    if (index > cursor) parts.push({ type: "text", value: value.slice(cursor, index) });

    const matched = match[0];
    const trailing = matched.match(TRAILING_LINK_PUNCTUATION)?.[0] ?? "";
    const link = trailing ? matched.slice(0, -trailing.length) : matched;

    if (link) parts.push({ type: "link", value: link });
    if (trailing) parts.push({ type: "text", value: trailing });
    cursor = index + matched.length;
  }

  if (cursor < value.length) parts.push({ type: "text", value: value.slice(cursor) });
  return parts;
}

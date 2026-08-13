export const SITE_NAME = "My Moment";
export const SITE_ORIGIN = "https://moment.you-find.me";

export const PUBLIC_PAGE_META = {
  gallery: {
    title: "My Moment — 私の瞬間",
    description: "A personal photo gallery and collection journal.",
    path: "/",
    image: "/api/og/gallery",
  },
  journey: {
    title: "Journey — My Moment",
    description: "A map of places that became part of the story.",
    path: "/journey",
    image: "/api/og/journey",
  },
  guestbook: {
    title: "Guestbook — My Moment",
    description: "Leave a small note in the guestbook.",
    path: "/messages",
    image: "/api/og/guestbook",
  },
  collection: {
    title: "Collection — My Moment",
    description: "Things collected, considered, and remembered.",
    path: "/collection",
    image: "/api/og/collection",
  },
  haul: {
    title: "Haul — My Moment",
    description: "Things I bought and what I think of them.",
    path: "/collection?view=haul",
    image: "/api/og/haul",
  },
  wishlist: {
    title: "Wishlist — My Moment",
    description: "Things I'm hoping to get.",
    path: "/collection?view=wishlist",
    image: "/api/og/wishlist",
  },
} as const;

export type PublicPageKey = keyof typeof PUBLIC_PAGE_META;

interface SocialMetaOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}

export function socialMeta(options: SocialMetaOptions) {
  const pageUrl = new URL(options.path, SITE_ORIGIN).href;
  const imageUrl = options.image ? new URL(options.image, SITE_ORIGIN) : null;
  if (imageUrl) imageUrl.searchParams.set("v", new Date().toISOString().slice(0, 10));

  const image = imageUrl
    ? [
        { property: "og:image", content: imageUrl.href },
        { property: "og:image:secure_url", content: imageUrl.href },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: options.title },
        { name: "twitter:image", content: imageUrl.href },
        { name: "twitter:image:alt", content: options.title },
      ]
    : [];

  return [
    { title: options.title },
    { name: "description", content: options.description },
    { property: "og:title", content: options.title },
    { property: "og:description", content: options.description },
    { property: "og:url", content: pageUrl },
    { property: "og:type", content: options.type ?? "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: options.title },
    { name: "twitter:description", content: options.description },
    ...image,
  ];
}

export function publicPageMeta(key: PublicPageKey) {
  return socialMeta(PUBLIC_PAGE_META[key]);
}

export function privatePageMeta(title: string) {
  return [
    { title: `${title} — ${SITE_NAME}` },
    { name: "robots", content: "noindex, nofollow, noarchive" },
  ];
}

export const SITE_NAME = "My Moment";

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
  const image = options.image
    ? [
        { property: "og:image", content: options.image },
        { name: "twitter:image", content: options.image },
      ]
    : [];

  return [
    { title: options.title },
    { name: "description", content: options.description },
    { property: "og:title", content: options.title },
    { property: "og:description", content: options.description },
    { property: "og:url", content: options.path },
    { property: "og:type", content: options.type ?? "website" },
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

# my-moment

Personal moments — [moment.you-find.me](https://moment.you-find.me)

## Stack

Vite+ · Void · SolidJS · TypeScript · TailwindCSS v4 · Hono · TanStack Router · Better Auth · Cloudflare Workers · D1 · R2 · KV · Durable Objects · Mapbox

## Features

- **Gallery** — photo collection with masonry and list views
- **Journey** — personal places displayed on an interactive map
- **Collection** — playlists, anime, films, and the things I love
- **Guestbook** — authenticated guestbook with replies and infinite scrolling
- **Haul / Wishlist** — tracking purchases and wants, accessible from the navigation icons

## API

The owner can generate or rotate a one-time-view API key from the site header. Send it as a bearer
token to `/api/v1/photos`, `/api/v1/tags`, or the stateless MCP endpoint at `/api/mcp`.

```sh
curl -H "Authorization: Bearer $MOMENT_API_KEY" \
  https://moment.you-find.me/api/v1/photos
```

`API_KEY` uses the `ApiKeyDurableObject` exported by `my-knowledge`. Photo creation expects the
original and thumbnail to exist in R2 before their metadata is submitted.

## References

- [Afilmory/afilmory](https://github.com/Afilmory/afilmory) — Reference for HEIC/HEIF signature detection and browser-side conversion before the gallery's existing image processing pipeline.
- [Pleasurecruise/my-memos](https://github.com/Pleasurecruise/my-memos) — Workspace and reusable UI package organization, semantic theme tokens and theme switching, plus the Cloudflare, Better Auth, D1, R2, and KV application patterns.
- [sxzz/kevins-journey](https://github.com/sxzz/kevins-journey) — Inspiration for the Journey page's Mapbox travel-footprint visualization and map interactions.
- [dogxii/iGoods](https://github.com/dogxii/iGoods) — Reference for the Haul item model, four-tier ratings, goods cards and detail views, and category, search, filtering, and sorting interactions.
- [dogxii/astro-doge](https://github.com/dogxii/astro-doge) — Reference for the Guestbook interaction model and its data-driven emoji and sticker packs, including remote image sources.

## License

[AGPL-v3](LICENSE)

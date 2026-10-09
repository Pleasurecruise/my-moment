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

The web app and external clients share one REST surface under `/api`, described by
[`/api/openapi.json`](https://moment.you-find.me/api/openapi.json). Reads need no key: photos
(`/api/photos`, `/api/photos/{id}`, `/api/gallery`), tags (`/api/tags`), and the collection
(`/api/media?kind=anime|film`, `/api/haul`, `/api/wish`, `/api/music`). Writes accept the owner
session or the one-time-view API key the owner generates or rotates from the site header; a request
that sends `Authorization` is checked only against the key.

```sh
curl https://moment.you-find.me/api/photos?search=edinburgh
curl -X PATCH -H "Authorization: Bearer $MOMENT_API_KEY" -H "Content-Type: application/json" \
  -d '{"tags":["travel"]}' https://moment.you-find.me/api/photos/<id>
```

`POST /api/photos` registers an original and thumbnail that already exist in R2;
`POST /api/photos/upload` is the browser's multipart upload. `API_KEY` uses the
`ApiKeyDurableObject` exported by `my-knowledge`.

The stateless MCP endpoint at `/api/mcp` takes the same key. Its tools follow the shared
`verb_noun` naming of my-memos and my-knowledge: `list_photos`, `search_photos`, `get_photo`,
`create_photo`, `update_photo`, `delete_photo`, and `list_tags`. Arguments reuse the REST field names
(`fromDate`, `toDate`, `tags`, `limit`); single photos return `{ photo }`, searches
`{ type: "photo-search-results", query, photos }`, and deletion `{ id, deleted: true }`.

`/llms.txt` lists these entry points before the photo index, and `/.well-known/api-catalog` links
the OpenAPI document and this section.

## References

- [Afilmory/afilmory](https://github.com/Afilmory/afilmory) — Reference for HEIC/HEIF signature detection and browser-side conversion before the gallery's existing image processing pipeline.
- [Pleasurecruise/my-memos](https://github.com/Pleasurecruise/my-memos) — Workspace and reusable UI package organization, semantic theme tokens and theme switching, plus the Cloudflare, Better Auth, D1, R2, and KV application patterns.
- [sxzz/kevins-journey](https://github.com/sxzz/kevins-journey) — Inspiration for the Journey page's Mapbox travel-footprint visualization and map interactions.
- [dogxii/iGoods](https://github.com/dogxii/iGoods) — Reference for the Haul item model, four-tier ratings, goods cards and detail views, and category, search, filtering, and sorting interactions.
- [dogxii/astro-doge](https://github.com/dogxii/astro-doge) — Reference for the Guestbook interaction model and its data-driven emoji and sticker packs, including remote image sources.

## License

[AGPL-v3](LICENSE)

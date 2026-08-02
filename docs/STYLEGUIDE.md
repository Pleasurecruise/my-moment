# Style Guide

This guide defines the local style for My Moment. Prefer clear domain names, explicit
boundaries, and ordinary TypeScript over decorative abstraction. When in doubt, follow
nearby code and keep changes small.

## Scope

- These rules apply most strictly to production code in `apps/moment/src` and
  `packages/ui/src`.
- Dev-only demos under `packages/ui/dev` may use inline layout styles when that keeps
  examples compact.
- Theme foundation files (`tokens.css`, `palette.css`, `theme.css`) may define raw
  CSS variables and hex values; application code should consume semantic tokens.
- Official brand artwork may keep its required brand colors.

## Core Rules

- Prefer readable code over clever code.
- Prefer project conventions over personal preference.
- Prefer framework, platform, and package APIs before adding wrappers.
- Keep helpers close to the feature that owns them.
- Add abstraction only when it removes real duplication, isolates an external boundary,
  or gives a domain operation a useful name.
- Keep unrelated refactors out of feature changes.

## Naming

Names should describe the domain role of a value, not its implementation type.

```ts
const messages = await listMessages();
const canDeleteMessage = user?.id === message.authorId;
const tagCounts = countPhotoTags(photos);
```

Avoid names that only say "something exists":

```ts
const data = await getData();
const flag = check(user, message);
const photoArray = await getPhotos();
```

- Use `PascalCase` for types, classes, and Solid components.
- Use `camelCase` for variables, functions, methods, and object properties.
- Use `UPPER_SNAKE_CASE` only for constants that represent shared policy.
- Use concrete nouns for values: `photo`, `message`, `session`, `tagCounts`.
- Use verbs for functions: `createMessage`, `loadTags`, `updatePhoto`.
- Use predicate names for booleans: `isArchived`, `hasSession`, `canDelete`.
- Avoid vague names: `data`, `info`, `payload`, `result`, `item`, `obj`, `temp`,
  `utils`.
- Avoid type-encoded names: `photoArray`, `nameString`, `responseObject`.
- Use transport names only at transport boundaries. Database records can be `row`;
  application data should be `photo`, `message`, or another domain noun.

Allowed suffixes:

- `Props` for component props.
- `Options` for optional configuration input.
- `Config` for stable configuration objects.
- `Error` for error classes or error values.
- `Request` and `Response` for protocol boundaries.

## Types

Use TypeScript to describe contracts, not to restate obvious local inference.

- Use inference for local values.
- Add explicit types at exported functions, route params, Cloudflare bindings,
  database rows, serialized API responses, and shared package APIs.
- For untrusted request bodies and query params, let the schema or named parser own the
  input contract, then pass its inferred domain type inward. Keep form input types
  separate from parsed domain types when a field changes representation.
- Use discriminated unions for operations with mutually exclusive success and failure
  states. Do not model errors as nullable data plus unrelated optional flags.
- Avoid display-only aliases such as `type PhotoId = string` unless the name is reused
  across modules or documents a stable contract.
- Type-query `typeof` is fine in type positions, for example
  `ReturnType<typeof getAuth>` or Drizzle inference.

## Validation

Validate external input once at the boundary and pass typed domain values inward.

- Use schema validators, framework validators, SDK validators, or named domain parsers.
- Prefer Zod schemas for request bodies and query params in app code.
- Do not replace parser contracts with ad hoc casts such as
  `await request.json() as { content?: unknown }`.
- Avoid scattered runtime `typeof` checks in executable code; put validation behind a
  parser when the shape matters.
- `Array.isArray` and simple display checks are acceptable when they do not define a
  domain contract.

```ts
const result = messageCreateSchema.safeParse(await request.json());

if (!result.success) {
  throw error(400, "Invalid request body");
}

const input = result.data;
```

## `any`, `unknown`, And Assertions

- Avoid `any`; it disables the checks this project relies on.
- Allowed `any`: narrow third-party compatibility shims, temporary migration code with
  a nearby TODO and owner, and tests that intentionally construct invalid values.
- Use `unknown` for untrusted input, then validate before it leaves the boundary.
- Avoid assertions that depend on ad hoc runtime checks. Parse into a named type first.

## Helpers And Abstractions

Create a helper when it:

- removes repeated logic in three or more places
- isolates D1, R2, KV, auth, AI SDK, or another external boundary
- gives one name to a real domain operation
- makes error handling or cleanup consistent

Avoid helpers that only rename one line. Avoid generic utility piles; `utils.ts` is
acceptable only when each export has a clear owner and call site.

## Constants

Constants should name shared policy, not hide ordinary literals.

```ts
const MAX_EXCERPT_LENGTH = 240;
const GALLERY_CACHE_KEY = "gallery:list";
```

- Extract a constant when the value is reused, configurable, or names a policy.
- Keep one-off literals inline when the literal is clearer than the name.
- Do not create constants for CSS classes unless the class string is shared across
  three or more components.
- Keep constants near their use unless they are part of a cross-module contract.

## Fallbacks

Fallbacks should describe deliberate product behavior, not hide invalid state.

- Display fallbacks are fine: `photo.title.trim() || "Untitled"`.
- Do not fallback secrets, bindings, auth state, database IDs, cache keys, or
  permissions.
- Prefer throwing or returning a typed error at server boundaries.
- Avoid broad `catch` blocks that return empty arrays, empty objects, or success states.
- Reject malformed pagination cursors and query parameters with `400`; never reinterpret
  them as the first page.
- Treat `404` as missing data only when the endpoint contract says so. Surface auth and
  server failures separately.

## Styling

The project uses Tailwind CSS v4 through `@tailwindcss/vite`. `theme.css` maps
`--color-*`, `--radius-*`, `--shadow-*`, and `--font-*` tokens to Tailwind utilities.

- Use semantic token utilities such as `bg-background`, `text-muted-foreground`,
  `rounded-lg`, and `shadow-sm`.
- Do not use raw color utilities such as `bg-gray-100` or `text-blue-500` in
  application code.
- Do not write bare hex colors outside theme foundation files or official brand SVGs.
- Prefer Tailwind utilities over `style=` for layout, spacing, typography, color, and
  radius.
- Use CSS custom properties for dynamic numeric styles:
  `style="--w:{value}%" class="w-[var(--w)]"`.
- Use arbitrary values only for one-off details outside the scale. Promote repeated
  values to `tokens.css` and `theme.css`.
- Compose conditional class strings with `cn()` from `@my-moment/ui`; simple binary
  interpolation is fine.
- Use scoped `<style>` blocks only for selectors or third-party overrides Tailwind
  cannot express cleanly.

## Project APIs

- Use TanStack Solid Router for route definitions, search validation, navigation, and
  redirects.
- Use Hono for Worker API routes and validate request bodies and query parameters with
  Zod at the route boundary.
- Prefer Drizzle for schema-backed CRUD. Raw SQL is acceptable for focused D1 queries
  when it is clearer, but keep it inside the owning repository.
- Use Solid primitives (`createResource`, `createMemo`, `Show`, `Switch`) directly; make
  loading, missing, unauthorized, and failed states distinct.
- Use `@my-moment/ui` for generic UI primitives.
- Use Cloudflare D1, R2, and KV bindings directly at server boundaries until a wrapper
  has clear value.
- Use standard library helpers before adding local utilities.

## Review Checklist

Before committing non-trivial code, check for:

- vague names or identifiers that encode implementation types
- redundant local type annotations
- one-call-site helpers with no boundary value
- constants that hide obvious literals
- `any`, long-lived `unknown`, unsafe casts, or scattered runtime validation
- fallbacks that hide invalid identity, permission, secret, or storage state
- duplicated logic that should move behind a domain function
- raw color utilities, bare hex colors, or avoidable inline styles
- arbitrary Tailwind values repeated three or more times without a token

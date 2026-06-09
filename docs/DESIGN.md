# Design System

Warm fog light, warm charcoal-amber dark. One theme, two modes, no decoration for its own sake.

## Architecture

```
Physical (external)
  Tailwind built-ins or bare CSS named colors — untouchable
      ↓
Palette  packages/ui/src/styles/palette.css
  Every hand-crafted oklch literal the project owns, named by mode and role
      ↓
Semantic  packages/ui/src/styles/tokens.css
  --color-*, --font-*, --radius-*, --shadow-*, --tracking-* vars that code uses
      ↓
Theme  packages/ui/src/styles/theme.css
  @theme inline block that maps semantic tokens into Tailwind utilities
```

**Rule:** project code references semantic tokens only. Never write a raw oklch literal or a `--palette-*` var outside of `tokens.css`.

## Palette

The project uses the [OKLCH](https://oklch.com/) color space throughout — perceptually uniform, wide-gamut friendly, and human-readable. All values are expressed as `oklch(L C H)`.

### Light

Warm fog neutrals — L 0.87–0.98, C ≤ 0.015, H 86–95. The background carries a faint warm undertone rather than being pure white. All text meets WCAG AA (≥ 4.5 : 1) on `--color-background`.

| Role            | oklch value             | Description             | Contrast on bg |
| --------------- | ----------------------- | ----------------------- | -------------- |
| page background | `oklch(0.980 0.008 95)` | Warm fog white          | —              |
| card / popover  | `oklch(0.992 0.002 90)` | Near-white surface      | —              |
| sidebar         | `oklch(0.975 0.005 92)` | Slightly recessed panel | —              |
| muted surface   | `oklch(0.94 0.01 88)`   | Oat tint                | —              |
| border          | `oklch(0.87 0.008 86)`  | Soft warm divider       | —              |
| secondary text  | `oklch(0.45 0.012 82)`  | Warm mid-grey           | 4.71 : 1       |
| body / headings | `oklch(0.22 0.012 80)`  | Warm near-black         | 14.0 : 1       |

### Dark

Warm charcoal-amber ramp — L 0.165–0.27, C ≤ 0.015, H 88. Hue is locked to 88 across all background and border layers so the mode reads as a coherent warm-dark space rather than neutral grey.

| Role            | oklch value             | Description        | Contrast on bg |
| --------------- | ----------------------- | ------------------ | -------------- |
| page background | `oklch(0.165 0.014 88)` | Deep warm charcoal | —              |
| card / popover  | `oklch(0.205 0.014 88)` | Raised surface     | —              |
| sidebar         | `oklch(0.185 0.014 88)` | Recessed panel     | —              |
| muted surface   | `oklch(0.24 0.014 88)`  | Elevated tint      | —              |
| border          | `oklch(0.27 0.014 88)`  | Warm divider       | —              |
| secondary text  | `oklch(0.62 0.010 88)`  | Warm mid-tone      | 5.10 : 1       |
| body / headings | `oklch(0.93 0.008 92)`  | Warm off-white     | 13.8 : 1       |

### Brand Accent — Smörkräm (Cream Yellow)

_Smörkräm_ (Swedish: butter cream) is the color of slow-churned Nordic dairy — the faint golden warmth of cream set in a shallow wooden bowl. Neither yellow nor white, it occupies the narrow, luminous band between the two. In Nordic design, warmth is never shouted; it is implied through materials and restraint. This accent does not demand attention, it rewards it.

| Variable      | oklch value           | Mode  | Role                          | Contrast              |
| ------------- | --------------------- | ----- | ----------------------------- | --------------------- |
| primary light | `oklch(0.82 0.12 95)` | light | primary actions, focus ring   | background on primary |
| accent light  | `oklch(0.88 0.10 95)` | light | hover states, accent surfaces | —                     |
| primary dark  | `oklch(0.74 0.13 93)` | dark  | primary actions, focus ring   | background on primary |
| accent dark   | `oklch(0.30 0.12 93)` | dark  | accent surfaces               | —                     |

Accent-foreground (text **on** a primary-colored background):

| Context    | oklch value            | Description     | Contrast             |
| ---------- | ---------------------- | --------------- | -------------------- |
| light mode | `oklch(0.28 0.025 78)` | Warm near-black | ≥ 4.5 : 1 on primary |
| dark mode  | `oklch(0.18 0.02 78)`  | Deep warm-black | ≥ 4.5 : 1 on primary |

Ring (focus outline) uses a slightly desaturated variant of the accent to remain calm:

| Context    | oklch value           | Intention                   |
| ---------- | --------------------- | --------------------------- |
| light mode | `oklch(0.78 0.10 95)` | Visible but not aggressive  |
| dark mode  | `oklch(0.72 0.10 93)` | Consistent softness in dark |

### Semantic States

Drawn from Nordic natural materials — muted, credible, never alarming.

| Semantic | Light value           | Dark value           | Description                                         |
| -------- | --------------------- | -------------------- | --------------------------------------------------- |
| success  | —                     | —                    | Use `oklch(0.45 0.12 145)` / `oklch(0.75 0.10 145)` |
| warning  | —                     | —                    | Use `oklch(0.50 0.14 70)` / `oklch(0.78 0.11 80)`   |
| error    | `oklch(0.55 0.22 25)` | `oklch(0.62 0.2 25)` | Muted brick-red                                     |

## Semantic Tokens

| Token                          | Light                 | Dark                  | Use for                      |
| ------------------------------ | --------------------- | --------------------- | ---------------------------- |
| `--color-background`           | fog white             | deep warm charcoal    | page surface                 |
| `--color-card`                 | near-white surface    | raised surface        | card, modal background       |
| `--color-popover`              | near-white surface    | raised surface        | dropdown, tooltip            |
| `--color-sidebar`              | recessed panel        | recessed panel        | sidebar rail                 |
| `--color-muted`                | oat tint              | elevated tint         | muted / tinted surface       |
| `--color-foreground`           | warm near-black       | warm off-white        | default body text            |
| `--color-muted-foreground`     | warm mid-grey         | warm mid-tone         | secondary text, captions     |
| `--color-border`               | soft warm divider     | warm divider          | outlines, dividers           |
| `--color-ring`                 | softened cream accent | softened cream accent | focus rings                  |
| `--color-primary`              | cream yellow          | cream yellow (dimmed) | CTA buttons, key actions     |
| `--color-primary-foreground`   | warm near-black       | deep warm-black       | text on primary              |
| `--color-secondary`            | muted surface         | muted surface         | secondary buttons            |
| `--color-secondary-foreground` | body text             | body text             | text on secondary            |
| `--color-accent`               | light cream accent    | dark cream accent     | hover tints, accent surfaces |
| `--color-accent-foreground`    | warm near-black       | warm off-white        | text on accent background    |
| `--color-destructive`          | muted brick-red       | muted brick-red       | errors, destructive actions  |

## Border Radius

Nordic design favors subtle rounding — corners that suggest craft without being playful. The base radius is `0.625rem` (10px). Derived values are computed relative to this base.

| Token         | Computed value | Tailwind class | Use for                        |
| ------------- | -------------- | -------------- | ------------------------------ |
| `--radius-sm` | `0.375rem`     | `rounded-sm`   | small chips, tags, checkboxes  |
| `--radius-md` | `0.625rem`     | `rounded-md`   | buttons, inputs, select fields |
| `--radius-lg` | `0.875rem`     | `rounded-lg`   | cards, panels, popovers        |
| `--radius-xl` | `1.125rem`     | `rounded-xl`   | dialogs, drawers, sheets       |

## Shadows

Shadows are restrained and warm-tinted. Depth is communicated primarily through background contrast and border color, not through dramatic blur. Shadow color derives from the warm-dark foreground tone.

| Token         | Use for                          |
| ------------- | -------------------------------- |
| `--shadow-sm` | cards at rest, subtle lift       |
| `--shadow-md` | popovers, dropdowns, tooltips    |
| `--shadow-lg` | dialogs, modals, command palette |

Dark-mode shadows use pure black at low opacity to retain perceived depth without color contamination.

## Typography

| Token         | Stack                                                         | Use for               |
| ------------- | ------------------------------------------------------------- | --------------------- |
| `--font-sans` | Inter → ui-sans-serif → system-ui → Segoe UI → Roboto → Arial | body, UI labels       |
| `--font-mono` | JetBrains Mono → ui-monospace → SF Mono → Cascadia Code       | code, timestamps, IDs |

Inter is the canonical Nordic UI typeface — rational geometry, open apertures, and consistent stroke weight across optical sizes. No display or serif family is included; when long-form prose is needed, Inter at relaxed line-height is sufficient.

**Weight rules:**

- Body text: 400
- Medium emphasis (labels, captions): 500
- Headings: 600 maximum — avoid 700+ unless the typeface explicitly supports it at display sizes

**Letter-spacing:**

| Token               | Value     | Use for                          |
| ------------------- | --------- | -------------------------------- |
| `--tracking-tight`  | `-0.02em` | Display headings, large numerals |
| `--tracking-normal` | `0em`     | Body text, UI labels (default)   |
| `--tracking-wide`   | `0.04em`  | Small caps, overlines, captions  |

**Line-height:**

| Token                   | Value  | Use for                              |
| ----------------------- | ------ | ------------------------------------ |
| `--line-height-tight`   | `1.25` | Display headings                     |
| `--line-height-normal`  | `1.5`  | Default body text, UI elements       |
| `--line-height-relaxed` | `1.75` | Long-form prose, comfortable reading |

## Theme Switching

Dark mode is triggered by a `.dark` class on `<html>`. All color tokens are redefined in the `.dark` block in `tokens.css`; no component-level dark-mode overrides are needed.

Apply the theme class before first paint to avoid a flash of the wrong mode. Read the user's stored preference from `localStorage`, fall back to `prefers-color-scheme`.

## Usage

```css
@import "@my-moment/ui/styles";
```

```css
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}

.card:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

Or through Tailwind utilities:

```html
<div class="bg-card border border-border rounded-lg shadow-sm text-foreground">
  <p class="text-muted-foreground text-sm leading-relaxed tracking-wide">…</p>
  <button class="bg-primary text-primary-foreground rounded-md px-4 py-2">Action</button>
</div>
```

## Principles

1. **Warm in both modes** — light and dark share the same hue family (H 88–95). Neither mode is cold or neutral.
2. **Semantic tokens only in code** — never write a raw `oklch()` literal or a palette value in component files.
3. **Accent is restrained** — the cream-yellow covers ≤ 5 % of visible area. Primary buttons, focus rings only. Resist using it as a highlight or decoration.
4. **Low chroma always** — C ≤ 0.015 for backgrounds, C ≤ 0.014 for dark surfaces. If a new neutral color reads as tinted, it is too saturated.
5. **Breathing room** — generous whitespace and relaxed line-height are design decisions, not gaps to fill. Resist the impulse to compress.
6. **Flat over layered** — prefer border and background contrast to establish depth. Reach for shadow only when an element genuinely floats above the page.
7. **New oklch literal goes to palette first** — add it to `palette.css` with a descriptive name, then reference it from `tokens.css`.
8. **No new semantic token without discussion** — one-off opacity adjustments use `color-mix(in oklch, var(--color-foreground) 60%, transparent)`.

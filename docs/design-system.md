# ندوات — Design system

The visual identity is carried by typography, spacing and restraint — not effects.
All tokens are defined once in [`src/app/globals.css`](../src/app/globals.css) under
`@theme`. Do not introduce colours or type sizes elsewhere.

## Principle

Arabic civic institution meets high-quality editorial publication. ~70% institution,
~30% publication. RTL-first. When in doubt, remove the element.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| `cream` | `#F5F0E6` | Page background (never pure white) |
| `cream-deep` | `#ECE4D1` | One or two quiet section grounds (subscribe) |
| `olive` | `#46543D` | **Dominant brand colour** — footer, brand band, primary buttons, links |
| `olive-dark` | `#38442F` | Button hover / pressed |
| `sage` | `#6F8F72` | Secondary — used sparingly |
| `gold` | `#D3A24C` | Accent 1 — hairline rules, selection; rare |
| `clay` | `#C97A5A` | Accent 2 — "upcoming" kicker only |
| `ink` | `#26241F` | Body text (warm near-black) |
| `muted` | `#5C574C` | Metadata, supporting text |
| `line` / `line-strong` | `#D5CBB5` / `#C3B795` | Hairlines, input borders |

No gradients. No section-per-colour blocking — most of the page is cream with
hairline dividers. Errors use a dedicated accessible red (`#a8402a` text).

## Type

- **Reem Kufi** (`font-display`) — hero headline, section headings, debate titles,
  card headings, names, `نختلف باحترام`.
- **IBM Plex Sans Arabic** (`font-sans`) — body, forms, nav, metadata, dates, UI,
  long reading.
- Loaded via `next/font/google` with `arabic` + `latin` subsets, `display: swap`.

Scale (utility → clamp): `text-display`, `text-h1`, `text-h2`, `text-h3`,
`text-body-lg`, `text-body`, `text-meta`, `text-kicker`. Line-heights are generous
(body 1.9–2.0). Never apply `letter-spacing` to Arabic. Headline sizes are
deliberately moderate — no oversized startup hero.

## Spacing & layout

- 4px base scale (Tailwind default).
- `.container-page` — max `74rem`, fluid inline padding `clamp(1.25rem, 5vw, 3rem)`.
- `.container-text` / `.prose-ar` — `44rem` max for comfortable Arabic measure.
- `.section-y` — vertical rhythm `clamp(3.5rem, 8vw, 7rem)`.

## Borders & shape

- Radius: `--radius` 4px default, `--radius-md` 6px (cards), `--radius-lg` 8px
  (lead images). Restrained — no pills, no heavy rounding.
- Hairlines (`border-line`) do most of the separating work. Cards are mostly
  borderless; sections flow into one another.

## Buttons

`components/ui/button.tsx` — `primary` (olive fill), `outline` (hairline),
`ghost`. Sizes `md` / `sm`. 150ms colour transition only. Visible focus ring
(`outline-olive`, offset). Links that mean "forward" use `ArrowLink` — the arrow
points **left** (reading direction) and nudges on hover.

## Cards & media

- Debate thumbnail: 16:9, YouTube `hqdefault`. Subtle `scale(1.03)` on hover.
- Speaker/moderator portrait: 4:5 (`square` variant for profiles). No stock
  imagery — a name treatment stands in when no portrait exists.
- Past debates use the YouTube thumbnail and video, never separate photography.

## Motion

- `Reveal` component: one-time fade + 14px rise on scroll-in. `IntersectionObserver`,
  renders visible if unavailable.
- Everything else is CSS `transition` (≤200ms). No JS animation library.
- `prefers-reduced-motion: reduce` disables transitions/animation globally and
  renders `Reveal` content statically.

## RTL

- `<html lang="ar" dir="rtl">`.
- Logical properties only (`ps/pe`, `ms/me`, `border-s/e`, `start/end`,
  `text-start`). No hard `left/right`.
- Numerals, dates and the email address use `dir="ltr"` / `unicode-bidi: isolate`
  so they read correctly inside Arabic text.
- Mobile gets equal attention — the nav is a full-panel Reem Kufi menu, not a
  mirrored desktop dropdown.

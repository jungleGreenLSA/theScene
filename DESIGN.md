# The Scene — Design Overview

A car-enthusiast community — *"Your car. Your page. Your people."* Every car gets its own garage page (specs, mods, photos, guestbook). Built on **Next.js 16 + React 19 + Supabase**, styled with **Tailwind v4** plus a hand-rolled class layer in `src/app/globals.css`.

**One membership, free.** There is no premium tier anywhere in the product, the copy, or the schema (see `supabase/migrations/024_one_membership.sql`). Members sign up with Google or email through Supabase Auth.

---

## Theme: "After Hours"

The original palette — grey / purple / orange neon — rebuilt with a harder hand. Late-night street, wet asphalt, sodium lamps, a violet cast off the signage. Flat panels, real 1px borders, condensed decal type, mono spec data, crop marks and hazard stripes.

Neon is treated as a **light source, not a coat of paint**: it shows up on rules, edges, active states and one headline line. Everything else is ink.

**Rules of the road**

- No gradient text. No glassmorphism or backdrop-blur panels. No soft purple blobs. No emoji as iconography.
- Radii stay at 0–3px. Borders are real and visible.
- Orange = action. Violet = identity / secondary. Everything else is ink and grey.
- Numbers are mono and tabular. Headlines are condensed, uppercase, tight, usually italic.
- Buttons press: a hard 3px black offset shadow that collapses on `:active`. No soft drop shadows.
- The hazard stripe (`.stripe`), the lit rule (`.neon-rule`) and crop marks (`.crop`) are the only decoration. Don't sprinkle them — one or two per page.

## Color palette

Tokens live in `@theme inline` in `globals.css`. Legacy names (`teal`, `purple`, `neon`) still resolve — to orange, violet and orange respectively — so older pages inherit the theme.

| Role | Token | Value |
|------|-------|-------|
| Canvas | `--color-background` | `#0b0b11` |
| Chassis (nav, footer, CTA) | `--color-ink` | `#08080d` |
| Panel | `--color-surface` | `#131320` |
| Raised / placeholder | `--color-surface-light` | `#1b1b2b` |
| Hover | `--color-surface-hover` | `#242438` |
| Inset (inputs, tiles) | `--color-surface-lowest` | `#07070c` |
| Border | `--color-border` / `-hover` | `#262636` / `#3b3b55` |
| Text | `--color-foreground` / `-soft` | `#eceaf2` / `#c8c5d6` |
| Muted | `--color-muted` / `-light` | `#8b87a0` / `#adaac1` |
| **Primary — Sodium Orange** | `--color-accent` (`-light`, `-bright`, `-deep`) | `#f97316` (`#fb923c`, `#fdba74`, `#9a3412`) |
| **Secondary — Violet** | `--color-steel` (`-light`, `-bright`, `-deep`) | `#8b5cf6` (`#a78bfa`, `#c4b5fd`, `#6d28d9`) |
| Success / Danger / Warning | | `#22c55e` / `#ef4444` / `#eab308` |

`--color-steel*` keeps its name from the previous theme but carries the original purple — renaming it would have touched every page for nothing.

The page sits on a fixed texture layer (`body::before`): a 1px diagonal hatch, a low violet bleed from the top-left, a sodium bleed from the bottom-right, and a vignette. Hard-edged and faint — it reads as surface, not as a gradient background.

## Typography

Loaded through `next/font/google` in `src/app/layout.tsx`.

- **Barlow Condensed** (`--font-barlow-condensed`, `--font-display`) — all `h1`–`h6`, nav tabs, buttons, big numbers. `h1`/`h2` are uppercase and tracked tight (`-0.005em`, tighter still on display sizes). Hero, CTA and the wordmark use 800 italic.
- **Barlow** (`--font-barlow`, `--font-sans`) — body at 15px / 1.55.
- **IBM Plex Mono** (`--font-plex-mono`, `--font-mono`) — `.spec`, `.eyebrow`, `.label-mono`, chips, table headers, captions, the ticker.

Why Barlow: it's drawn from California highway signage and license plates. It already sounds like a car.

## Class layer (globals.css)

| Class | What it is |
|-------|------------|
| `.panel` (alias `.glass`) | Default container. Surface + 1px border + 3px radius. `.panel-accent` / `.panel-violet` add a 3px top rule; `.panel-inset` is the darker inner tile; `.panel-ink` is the deep chassis block used for CTAs. |
| `.section-head` | `.idx` (mono index chip) + `h2` + `.rule` (line running right, with a 48px orange leader) + `.meta`. Opens every section. |
| `.btn-primary` / `.btn-neon` | Orange, black text, hard 3px black press-shadow. Condensed uppercase. |
| `.btn-teal` | Secondary — violet fill, same press language. |
| `.btn-outline` | Quiet outline; orange on hover. |
| `.btn-google` | Off-white OAuth button, same press-shadow. |
| `.chip` / `.chip-purple` / `.chip-neon` | Stamped decals (orange outline / violet outline / solid orange). |
| `.dot-live` | Small blinking sodium square. One per view at most. |
| `.eyebrow`, `.label-mono`, `.spec` | Mono labels and data. |
| `.stencil` (`-accent`, `-violet`) | Outlined display type via `-webkit-text-stroke`. For oversized numerals and one headline line. |
| `.crop` | Two opposing corner brackets — frames a panel or photo like a print proof. |
| `.neon-rule` | 2px lit orange rule. The one real glow in the kit. |
| `.stripe` / `.stripe-violet` | Hazard stripe bar. |
| `.scan` | Faint scanline wash. Hero and CTA blocks only, never body copy. |
| `.figure` + `.caption` | Framed photo with a mono caption strip. |
| `.hero`, `.hero-photo`, `.hero-wash`, `.hero-inner`, `.hero-title` | Full-bleed landing hero. |
| `.data-strip` | Live counts welded under the hero — big italic numerals, mono labels. |
| `.ticker` / `.ticker-track` / `.ticker-pass` | Shop marquee. Two identical passes; the track translates -50% for a seamless loop. |
| `.ride-row` | Dense list row: thumb / title / mono meta. Hover paints a 3px orange inset bar. |
| `.feature-list` | Numbered 3-up grid with oversized outlined numerals bleeding off the corner. |
| `.spec-list` | Two-up checklist with mono `[✓]` ticks and hairline rules. |
| `.table-plain` | Zebra table with mono headers and tabular figures. |
| `.timeline` / `.timeline-dot` | Build timeline; violet spine, rotated orange square. |
| `.tote` | Legacy boxed stat board. The landing uses `.data-strip` instead. |

`.glow-*`, `.text-glow-*` and `.gradient-text` still exist as classes but are neutralised (gradient text is flat orange) so old markup doesn't break.

## Layout

### App shell — `src/app/layout.tsx`
`Navbar` → `<main class="site-main">` → `MobileTabBar` → `OnboardingWizard` → `Footer`. Dark only.

### Navbar — `src/components/Navbar.tsx`
Fixed, 56px, on ink with a **lit** orange rule underneath (2px + bloom). Wordmark is a small orange "TS" plate with a black offset, then **THE SCENE** in condensed italic caps. Tabs are condensed uppercase; the active tab gets a 3px orange underline that glows. Signed-out: **Sign in** (outline) and **Join free** (primary). Below 1024px: hamburger drawer plus the bottom `MobileTabBar`.

### Landing — `src/app/page.tsx` (server component, real data)
1. **Hero** — full-bleed member car under an ink wash, three-line italic headline (*Your car.* solid / *Your page.* outlined / *Your people.* orange), dek, Claim your garage / Walk the lot, and a mono reassurance line. The wash runs top-to-bottom on phones and left-to-right from 960px so the metal stays visible.
2. **Data strip** — live member / car / event / guestbook counts welded to the bottom of the hero.
3. **Lit rule**, then the **ticker** — real rows (latest builds, next events) scrolling as a shop marquee; house lines when the site is still empty.
4. **01 Fresh metal** + **02 On the board** — the six newest public builds and the next five events, from Supabase. Honest empty states.
5. **03 How it works** — three moves with outlined numerals.
6. **Everything's included. Full stop.** — the whole toolbox as a mono checklist, with a plain statement that there is no paid tier.
7. **04 Where the scene is** — member heatmap.
8. **CTA** — ink panel, hazard stripe, scanline wash: *Free. No tiers. Just cars.*

### Auth — `src/app/auth/*`
Google (via `components/GoogleButton.tsx`) first, then email. Login honours `?redirect=` from the auth guard. Register is a two-column pitch + form. Google sign-ups get a **Pick your handle** step in `OnboardingWizard` before location / photo / first car.

## Accessibility

- `:focus-visible` is a 2px orange outline with 2px offset, everywhere.
- Body and muted text clear WCAG AA on the ink canvas; orange is used for large/bold text, borders and fills rather than small grey-on-grey copy.
- `prefers-reduced-motion` kills transitions and animations, stops the marquee where it started (instead of snapping to the end) and makes the ticker manually scrollable.

## Overall feel

A street at 1 a.m. with the shop lights still on: ink, sodium, a violet cast, everything labelled and stamped. Loud type, quiet surfaces, real edges. Modern in its spacing, grid and responsiveness — old-school in its voice.

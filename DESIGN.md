# The Scene — Design Overview

A car-enthusiast social platform — *"The car community, reimagined."* Your car gets its own garage page (specs, mods, photos, guestbook), documented from **bone-stock to masterpiece**. Built on **Next.js 16 + React 19 + Supabase**, styled with **Tailwind v4**. Theme: **Premium Automotive Narrative** — a "Digital Museum" in Teal / Purple / Orange.

---

## Color Palette

Defined as theme tokens in `src/app/globals.css`.

| Role | Color |
|------|-------|
| **Background** | `#0c0c14` — deep ink canvas |
| **Surface / panels** | `#13131b` → `#1b1b23` (light) → `#292932` (hover) |
| **Foreground text** | `#e4e1ed` — soft off-white |
| **Muted text** | `#6b7280` / `#9ca3af` |
| **Primary accent — Teal** | `#2dd4bf`, light `#57f1db`, bright `#99f6e4` — action / active / brand |
| **Secondary accent — Purple** | `#8b5cf6`, light `#a78bfa`, bright `#c4b5fd` — identity / gradients |
| **Tertiary — Neon Orange** | `#f97316` — **featured / high-priority CTAs only** |
| **Success / Danger / Warning** | `#22c55e` / `#ef4444` / `#eab308` |

Borders are barely-there white at **8–14% opacity**. **Teal carries the design** (primary action), **purple is the identity accent**, and the brand gradient runs **teal → indigo → purple** (`#2dd4bf → #6366f1 → #a855f7`). Orange is reserved for genuinely featured content.

---

## Signature Visual Style

- **Atmospheric depth, not neon-overkill** — soft, localized teal/purple radial glows on a deep canvas let high-fidelity photography shine.
- **Glassmorphism** (`.glass`) — translucent `#13131b` at 80% with 16px backdrop blur, 16px rounded corners. The default container.
- **Skeuomorphism 2.0 buttons** — `.btn-primary` (brand gradient + inner glow), `.btn-teal`, `.btn-neon` (orange featured), `.btn-outline`. Top-light / bottom-dark bevels, lift `-2px` and glow on hover.
- **Brand gradient text** (`.gradient-text` / `.brand-text`) — teal→indigo→purple clip on the logo and headline accents.
- **Build cards** (`.build-card`) — photography background with a glass spec overlay (mono title + stats).
- **Card hover** (`.card-hover`) — lifts 4px with ambient shadow + teal-tinted edge.
- **Status chips** (`.chip` / `.chip-purple` / `.chip-neon`) — mono pill markers (Verified, For Sale, Street Legal).
- **Heatmap markers** — `.pulse-marker` rings via the `pulse-teal` keyframe.

---

## Typography

- **Inter** (`--font-inter`) — body / UI, loaded via `next/font/google`.
- **Geist Mono** (`--font-geist-mono`) — technical data: HP/torque, dates, VINs, part numbers, prices, and eyebrow labels.
- Body line-height **1.6**, antialiased; headings use fluid `clamp()` with tight tracking (`-0.02em`).
- **Eyebrow labels** (`.eyebrow` / `.label-mono`) — 11px, uppercase, mono, **0.2em** tracking, teal.
- **Spec data** (`.spec` / `.spec-data`) — 14px mono for the "engineering blueprint" feel.

---

## Layout Structure

### App shell — `src/app/layout.tsx`
Fixed Navbar → `<main class="site-main">` → MobileTabBar → OnboardingWizard → Footer. Forced dark mode (`<html class="dark">`).

### Navbar — `src/components/Navbar.tsx`
- Fixed top, **56px** tall, max-width **1200px**, blurred → near-opaque on scroll.
- Logo reads **THE**`SCENE` with the "SCENE" half in the teal→purple brand gradient.
- Desktop: search + primary links, **More** dropdown, notification bell, avatar menu. Active states teal.
- Below 1024px: hamburger drawer + a bottom **MobileTabBar**.

### Landing page — `src/app/page.tsx`
1. **Hero** (88vh) — full-bleed automotive photography with cinematic overlay, *"Your Ride Is Your **Identity.**"* and the brand-gradient accent.
2. **The Archive** — horizontal carousel of verified build cards (280px, photo + Y/M/M + Verified chip).
3. **The Digital Museum** — vertical build timeline; mono dates + technical captions, dot-and-line aesthetic.
4. **How It Works** → **Community Heatmap** (pulsing teal markers).
5. **Platform Features** → **Browse by Category** → **Garage Stats** → **Final CTA** ("Document your journey from bone-stock to masterpiece").

Responsive via CSS grid `auto-fit` + `minmax`, fluid `clamp()` type, and `overflow-x: clip` guards.

---

## Overall Feel

A refined, editorial **Digital Museum** — every vehicle treated as a work of art, documented like a technical manual. Dark and tactile, with **teal precision-LED accents**, **purple identity**, and orange held in reserve for what truly deserves the spotlight.

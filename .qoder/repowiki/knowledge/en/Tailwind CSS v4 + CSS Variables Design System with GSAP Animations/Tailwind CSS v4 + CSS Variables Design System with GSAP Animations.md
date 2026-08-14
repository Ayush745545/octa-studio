---
kind: frontend_style
name: Tailwind CSS v4 + CSS Variables Design System with GSAP Animations
category: frontend_style
scope:
    - '**'
source_files:
    - app/globals.css
    - postcss.config.mjs
    - app/layout.tsx
    - package.json
    - components/layout/workspace-layout.tsx
    - components/calendar/calendar-view.tsx
    - components/landing-client.tsx
---

## Styling Approach

The Octa Studio Next.js workspace uses **Tailwind CSS v4** (via `@tailwindcss/postcss` plugin) as its primary styling framework, combined with a small set of hand-written CSS variables and keyframe animations. There is no separate design token system or component library — visual consistency is achieved through shared CSS custom properties in `app/globals.css` and consistent use of Tailwind utility classes across components.

## Core Style Files

- `app/globals.css` — the single source of global styles: imports Tailwind via `@import "tailwindcss"`, declares CSS custom properties for background/foreground colors and a full zinc palette (`--color-zinc-50` through `--color-zinc-950`), maps font variables (`--font-geist-sans`, `--font-geist-mono`, `--font-inter`) into Tailwind's `@theme inline` block, and defines reusable animation keyframes (`modal-in`, `overlay-in`, `slide-in-right/left`, `fade-in/out`, `toast-in/out`).
- `postcss.config.mjs` — registers only `@tailwindcss/postcss`; no SCSS, Sass, PostCSS plugins beyond Tailwind.
- `next.config.ts` — minimal; no CSS-related configuration.
- `app/layout.tsx` — loads Google Fonts (Geist Sans/Mono, Inter) and attaches their CSS variables to `<html className="... h-full antialiased">`, which are then consumed by the Tailwind theme mapping.

## Design Tokens & Theme

Design tokens live exclusively as CSS custom properties in `:root`:
- Background/foreground: `--background: #0a0a0c`, `--foreground: #e4e4e7`
- Full zinc scale from 50–950 mapped to `--color-zinc-*`
- White/black: `--color-white`, `--color-black`
- Font variables exposed to Tailwind via `@theme inline`: `--font-sans`, `--font-mono`, `--font-display`

There is no `tailwind.config.*` file — Tailwind v4 uses CSS-based theming instead of JS config. Colors like the brand accent (`#7C3AED` purple/violet) and backgrounds (`#0a0a0c`, `#111113`) are used directly as arbitrary values in component `className` strings rather than being registered as named tokens.

## Component Styling Conventions

Components under `components/` are styled entirely with **inline Tailwind utility classes** on JSX elements — no per-component CSS files, no CSS modules, no styled-components. Examples:
- Dark-mode-first palette: `bg-[#0a0a0c]`, `text-white`, `border-zinc-800`, `text-zinc-500`
- Brand accent color `#7C3AED` (purple) used for highlights, hover states, and indicators
- Typography: headline text uses the `.headline` class (Inter Black, tight tracking, `line-height: 1.05`); body text falls back to `Arial, Helvetica, sans-serif` via `body` rule
- Responsive layouts rely on Tailwind responsive prefixes (`sm:grid-cols-2 lg:grid-cols-4`, etc.)
- Layouts use flexbox/grid utilities extensively (`flex h-[100dvh]`, `grid grid-cols-7`, `sticky top-0 z-30`)

## Animation Strategy

Animations are split between two systems:
1. **CSS keyframes** in `globals.css` for lightweight transitions (modals, overlays, slide-ins, toasts, fade-ins). Components toggle class names like `modal-enter`, `overlay-enter`, `slide-in-right`, `toast-enter`, `toast-exit` to trigger them.
2. **GSAP + ScrollTrigger** (`gsap` + `@gsap/react`) for complex scroll-driven animations, especially in `components/landing-client.tsx`. The landing page uses `gsap.context()` with `ScrollTrigger` timelines for pinned sections, staggered text reveals, and multi-phase animated showcases (calendar → post reschedule → device mockups).

## Responsive Strategy

Responsive behavior is handled purely through Tailwind's responsive breakpoints (`sm:`, `md:`, `lg:`) applied directly in component classNames. No media queries exist outside `globals.css`. The layout uses fluid units (`h-[100dvh]`, `min-h-full`, `clamp(...)` typography) and flexible grids to adapt across screen sizes.

## What Is Not Used

- No CSS preprocessors (no SCSS/Sass/Less)
- No CSS-in-JS libraries (no styled-components, emotion, vanilla-extract)
- No component UI library (no shadcn, radix-ui, mui, antd)
- No `tailwind.config.js/ts` — theming is done via CSS `@theme` and custom properties
- No BEM, CSS Modules, or scoped CSS patterns — all styling is utility-first
- No separate theme/tokens directory — tokens are in `app/globals.css`
## Context

The app previously used hardcoded Tailwind color classes throughout all components. The main app used stone/amber, while auth pages used a completely different slate/blue dark theme. There was no centralized color system. The user wanted to unify the visual identity, move away from the orange/amber accent, and — once we started iterating — decided that palette selection should be a permanent user-facing feature rather than a developer-only concern.

## Goals / Non-Goals

**Goals:**
- Centralized CSS custom property palette that all components reference
- 20 palette options switchable at runtime via a user-facing picker
- Palette choice persisted to localStorage across sessions
- Auth pages visually unified with main app (same palette, same feel)
- Warm off-white/cream backgrounds replacing the cold stone-100

**Non-Goals:**
- Syncing palette preference to the database (localStorage only for now)
- Component layout/spacing redesign (this change is color/palette only)
- Typography changes (fonts stay as-is)
- New component library or design system framework

## Decisions

### 1. Two-layer CSS variable architecture

**Decision**: Define raw palette values as CSS custom properties on `:root` (e.g., `--bg`, `--accent`), then register them as Tailwind theme colors via `@theme inline` (e.g., `--color-page: var(--bg)` → generates `bg-page` utility).

**Why two layers**: Tailwind v4 requires `--color-*` entries in `@theme inline` to generate utility classes. But palette switching needs to override the underlying values at runtime. The `@theme inline` block maps stable utility names to dynamic CSS variables. Components use clean Tailwind classes (`bg-page`, `text-ink`, `border-outline`) that resolve to whichever palette is active.

**Alternative rejected**: Tailwind arbitrary values (`bg-[var(--bg)]`). These failed to generate CSS in Tailwind v4's build pipeline — utilities were emitted but colors didn't resolve.

### 2. Runtime palette switching via `data-palette` attribute

**Decision**: All 20 palettes are defined in CSS simultaneously using `:root` (default) and `:root[data-palette="name"]` selectors. Switching palette = setting a data attribute on `<html>`.

**Why over comment-toggling**: Comment-toggling required dev server restarts and cache clearing. The `data-palette` approach is instant, works at runtime, and enabled the user-facing picker.

**Why `data-palette` over CSS classes**: Data attributes on `:root` have cleaner specificity behavior and don't risk collision with Tailwind utility classes.

### 3. User-facing palette picker (permanent feature)

**Decision**: A `PalettePicker` component rendered in `layout.tsx` provides a floating UI for palette selection. Initially built as a temporary dev tool, promoted to permanent feature at user's request.

**Persistence**: Selection stored in localStorage under key `palette`. Applied on mount via `useEffect` before first render.

**Placement**: Fixed position, bottom-left corner, expands upward on click. Uses hardcoded colors (not tokens) so it remains legible regardless of active palette.

### 4. Semantic token names

**Decision**: Use semantic names mapping to Tailwind utilities:
- `--bg` → `bg-page` (page background)
- `--surface` → `bg-surface` (cards, panels, inputs)
- `--text` → `text-ink` (primary text)
- `--text-muted` → `text-ink-muted` (secondary text)
- `--accent` → `bg-accent`, `text-accent`, `ring-accent` (primary actions)
- `--accent-hover` → `hover:bg-accent-hover` (hover states)
- `--accent-soft` → `bg-accent-soft` (subtle highlights)
- `--border` → `border-outline`, `divide-outline` (borders)

**Rationale**: Semantic names survive palette swaps. Components never need to change when palettes are added or modified.

### 5. Auth pages use identical palette

**Decision**: Auth pages use the same token classes as the main app. Card-based centered layout with `bg-surface` card on `bg-page` background.

**Rationale**: User explicitly wanted auth and main app to feel like one product.

## Risks / Trade-offs

- **20 palette definitions add CSS weight** (~3KB uncompressed) → Acceptable for the UX benefit. All palettes are simple `:root` variable overrides.
- **No dark mode consideration** → Intentionally deferred. The Midnight palette provides one dark option. Full system-preference dark mode can be added later.
- **localStorage-only persistence** → Palette resets if user clears browser data or uses a different device. Database sync deferred as non-essential.
- **Flash of default palette on load** → The stored palette is applied in a `useEffect`, so there's a brief flash of the default (Reverie) before the stored palette activates. Acceptable for now; could be solved with a blocking script in `<head>` if needed.

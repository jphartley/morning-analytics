## Why

The app's visual design had two problems: (1) the auth pages (dark slate/blue) looked like a completely different product from the main app (light stone/amber), and (2) the amber/orange color scheme didn't match the desired mood of intimate, quirky, and contemplative. The overall feel needed to be unified and elevated — and users should be able to personalize it.

## What Changes

- Define a centralized color palette using CSS custom properties in `globals.css`, replacing hardcoded Tailwind color classes across all components
- Register palette tokens via Tailwind v4's `@theme inline` block (e.g., `--color-page`, `--color-ink`) so they work as native Tailwind utilities (`bg-page`, `text-ink`)
- Provide 20 switchable palette options via a `data-palette` attribute on `<html>`, switched at runtime through a user-facing `PalettePicker` component
- Persist the user's palette choice to localStorage
- Restyle auth pages (signin, signup) to use the same palette and feel as the main app, eliminating the dark slate theme
- Replace the stone-100 background with warmer off-white/cream tones (varies per palette)
- Replace amber accent color throughout with each palette's accent
- Migrate remaining components (`AuthSessionProvider`, `Lightbox`) to use design tokens

## Capabilities

### New Capabilities
- `design-tokens`: CSS custom property-based color palette system with 20 user-switchable themes, runtime switching via `data-palette` attribute, and localStorage persistence

### Modified Capabilities
- `app-shell`: Background color, header styling, sidebar styling, and all components use design tokens instead of hardcoded stone/amber classes. New `PalettePicker` component in layout.
- `user-auth`: Auth pages (signin/signup) restyle to match main app palette instead of dark slate theme

## Impact

- `/app/app/globals.css` — 20 palette definitions as CSS custom properties + `@theme inline` registration
- `/app/app/layout.tsx` — includes `PalettePicker` component
- `/app/components/PalettePicker.tsx` — new component: floating palette switcher with localStorage persistence
- `/app/app/page.tsx` — token-based color classes
- `/app/components/AppHeader.tsx` — token-based colors
- `/app/components/HistorySidebar.tsx` — token-based colors
- `/app/components/JournalInput.tsx` — token-based colors
- `/app/components/AnalysisPanel.tsx` — token-based colors
- `/app/components/ImageGrid.tsx` — token-based colors
- `/app/components/LoadingState.tsx` — token-based colors
- `/app/components/ErrorState.tsx` — token-based colors
- `/app/components/ModelPicker.tsx` — token-based colors
- `/app/components/AnalystPicker.tsx` — token-based colors
- `/app/components/AuthSessionProvider.tsx` — token-based colors
- `/app/components/Lightbox.tsx` — token-based colors
- `/app/app/(auth)/signin/page.tsx` — full restyle
- `/app/app/(auth)/signup/page.tsx` — full restyle
- No API, database, or dependency changes

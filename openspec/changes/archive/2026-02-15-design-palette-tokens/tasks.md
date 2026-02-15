## 1. Define Color Tokens

- [x] 1.1 Add 20 palette definitions as CSS custom properties in `globals.css` — default `:root` (Reverie) plus 19 `:root[data-palette="..."]` variants
- [x] 1.2 Register palette tokens in `@theme inline` block (`--color-page`, `--color-ink`, etc.) to generate Tailwind utilities
- [x] 1.3 Remove the existing dark mode media query CSS variables (`--background`, `--foreground`) that are unused

## 2. Migrate Main App Components to Tokens

- [x] 2.1 Update `app/page.tsx` — replace `bg-stone-100` and other hardcoded colors with token utilities (`bg-page`, `text-ink`, etc.)
- [x] 2.2 Update `components/AppHeader.tsx` — replace stone/white colors with tokens
- [x] 2.3 Update `components/HistorySidebar.tsx` — replace stone/amber colors with tokens
- [x] 2.4 Update `components/JournalInput.tsx` — replace stone/amber colors with tokens
- [x] 2.5 Update `components/AnalysisPanel.tsx` — replace stone colors with tokens
- [x] 2.6 Update `components/ImageGrid.tsx` — replace stone/amber hover/focus rings with tokens
- [x] 2.7 Update `components/LoadingState.tsx` — replace amber spinner colors with tokens
- [x] 2.8 Update `components/ErrorState.tsx` — replace error styling colors with tokens where appropriate
- [x] 2.9 Update `components/ModelPicker.tsx` — replace stone/amber colors with tokens
- [x] 2.10 Update `components/AnalystPicker.tsx` — replace stone/amber colors with tokens
- [x] 2.11 Update `components/AuthSessionProvider.tsx` — replace stone colors with tokens
- [x] 2.12 Update `components/Lightbox.tsx` — replace stone colors with tokens

## 3. Migrate Auth Pages to Tokens

- [x] 3.1 Restyle `app/(auth)/signin/page.tsx` — replace dark slate/blue theme with token-based light theme matching main app
- [x] 3.2 Restyle `app/(auth)/signup/page.tsx` — replace dark slate/blue theme with token-based light theme matching main app

## 4. Palette Picker

- [x] 4.1 Create `PalettePicker` component with 20 palette swatches, "Choose your palette" title, and expand/collapse toggle
- [x] 4.2 Add localStorage persistence for palette selection (key: `palette`)
- [x] 4.3 Apply stored palette on mount via `useEffect`
- [x] 4.4 Add `PalettePicker` to `layout.tsx` so it appears on all pages

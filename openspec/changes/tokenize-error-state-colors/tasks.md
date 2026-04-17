## 1. Semantic Error Tokens

- [ ] 1.1 Add semantic error CSS custom properties in `app/app/globals.css`
- [ ] 1.2 Register semantic error colors in `@theme inline` so Tailwind utilities are generated

## 2. Migrate Error UI Surfaces

- [ ] 2.1 Update `app/components/ErrorState.tsx` to use semantic error token utilities
- [ ] 2.2 Update the save-error toast in `app/app/page.tsx` to use semantic error token utilities
- [ ] 2.3 Update auth error banners in `app/app/(auth)/signin/page.tsx` and `app/app/(auth)/signup/page.tsx`
- [ ] 2.4 Update the history load error message in `app/components/HistorySidebar.tsx`

## 3. Validation

- [ ] 3.1 Run targeted ESLint on changed files
- [ ] 3.2 Run a production build with safe mock and placeholder environment variables

## 1. Add semantic error tokens

- [x] 1.1 Add shared semantic error CSS custom properties in `app/app/globals.css`
- [x] 1.2 Register the error tokens in the Tailwind `@theme inline` block

## 2. Replace hardcoded error colors

- [x] 2.1 Update `app/components/ErrorState.tsx` to use semantic error token utilities
- [x] 2.2 Update the save error toast in `app/app/page.tsx` to use semantic error token utilities
- [x] 2.3 Update auth form error banners in `app/app/(auth)/signin/page.tsx` and `app/app/(auth)/signup/page.tsx`
- [x] 2.4 Update the history sidebar error message in `app/components/HistorySidebar.tsx`

## 3. Validation and debt tracking

- [x] 3.1 Update `TechnicalDebt.md` to remove the resolved error color tokenization debt item
- [x] 3.2 Run targeted linting and a production build for the changed files

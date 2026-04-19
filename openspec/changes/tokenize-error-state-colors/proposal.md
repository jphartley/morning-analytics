## Why

`TechnicalDebt.md` tracked a remaining palette-system gap: several error surfaces still used hardcoded red Tailwind classes instead of semantic design tokens. That made the design token migration incomplete and left error styling defined in multiple places.

## What Changes

- Add semantic error color tokens to `app/app/globals.css`
- Update existing error UI surfaces to use shared token-based Tailwind utilities instead of hardcoded red classes
- Mark the resolved technical debt item in `TechnicalDebt.md`

## Capabilities

### Modified Capabilities
- `design-tokens`: error states now use semantic token utilities in addition to the existing palette tokens

## Impact

- `app/app/globals.css` — add semantic error token definitions and Tailwind color registrations
- `app/components/ErrorState.tsx` — use tokenized error styles
- `app/app/page.tsx` — use tokenized save-error toast styles
- `app/app/(auth)/signin/page.tsx` — use tokenized auth error styles
- `app/app/(auth)/signup/page.tsx` — use tokenized auth error styles
- `app/components/HistorySidebar.tsx` — use tokenized history error text
- `TechnicalDebt.md` — mark the error-color debt item as resolved

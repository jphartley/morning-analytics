## Why

`TechnicalDebt.md` lists "Error state colors not tokenized" as a remaining gap in the design token system. The palette work centralized most color usage, but several error surfaces still use hardcoded Tailwind red classes, which makes the token system incomplete and leaves a small styling inconsistency behind.

This is a safe follow-up because it is:
- localized to styling-only code
- easy to validate with linting and a production build
- reversible without data or behavior risk

## What Changes

- add semantic error color tokens to `app/app/globals.css`
- register those tokens in `@theme inline` so they are available as Tailwind utilities
- replace the remaining hardcoded red error classes in shared UI surfaces with the new token utilities
- update `TechnicalDebt.md` to remove the resolved item

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `design-tokens` - adds semantic error token utilities for consistent error styling

## Impact

- `app/app/globals.css`
- `app/components/ErrorState.tsx`
- `app/app/page.tsx`
- `app/components/HistorySidebar.tsx`
- `app/app/(auth)/signin/page.tsx`
- `app/app/(auth)/signup/page.tsx`
- `TechnicalDebt.md`

No API, database, auth-flow, or dependency changes.

# Technical debt follow-up — 2026-07-04

## Technical debt item considered

- `TechnicalDebt.md`: **Palette preference not synced to database** — "Palette selection is localStorage-only. Resets if user clears browser data or uses a different device. Consider syncing to user profile in Supabase if cross-device persistence is desired."

## Why this could not be completed confidently

- I first triaged the two smallest implementation candidates in `TechnicalDebt.md` and found open draft pull requests already targeting them:
  - error-state color tokenization (`#90`, plus many earlier duplicates)
  - Next.js standalone output mode (`#51`, `#61`, `#64`)
- This palette-sync item was the next plausible candidate, but it is not a safe one-shot change because the repository does not yet define where the preference should live, when it should win over device-local state, or whether the correct palette must be available before hydration.

## Exact blockers

- Current palette persistence is entirely client-side:
  - `app/lib/palette-storage.ts` reads and writes `localStorage`
  - `app/components/PalettePicker.tsx` updates the DOM and `localStorage` only
- There is no existing Supabase-backed home for a palette preference:
  - the current migrations in `supabase/migrations/` only cover the `analyses` table and its row-level security (RLS) policies
  - there is no `profiles`, `user_preferences`, or similar table/column to store palette choice
- The app applies the palette before hydration through the inline bootstrap script in `app/app/layout.tsx`, which currently depends on `localStorage` being available immediately in the browser.
- The authentication stack is still client-session based. `TechnicalDebt.md` separately tracks the missing server-side session and middleware work, so a database-backed palette would either:
  - update after login and potentially change the palette after first paint, or
  - depend on broader auth/session changes that are outside the scope of a small autonomous technical-debt pull request

## Specific questions that need answers

1. Should palette preference sync exist at all, or should palettes intentionally remain device-local?
2. If sync is wanted, where should the preference live?
   - `auth.users.user_metadata`
   - a new `profiles` table
   - a dedicated `user_preferences` table
3. When local storage and the database disagree, which source should win on sign-in?
4. Is a post-login palette update acceptable, or must the correct palette be known before hydration to avoid a visible switch?
5. Should users be able to keep a device-local override even if a server-stored preference exists?

## Smallest next step for a human

Write a short decision note that answers the storage location and precedence questions above. Once that exists, the implementation can stay tightly scoped to:

- one small Supabase schema change,
- palette read/write updates in `app/lib/palette-storage.ts`,
- `app/components/PalettePicker.tsx`, and
- the auth-driven palette load path.

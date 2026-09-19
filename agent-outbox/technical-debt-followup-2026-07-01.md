# Technical Debt Follow-up — 2026-07-01

## Technical debt item considered

- **No system-preference dark mode**: "The Midnight palette provides one dark option, but there's no `prefers-color-scheme` media query integration. Full system-preference dark mode support can be added later."

## Why it could not be completed confidently

The two smallest and most localized technical debt items already have open draft pull requests:

- **Error state colors not tokenized** → open draft PR #88
- **Next.js standalone output mode** → open draft PR #64

Creating another pull request for either of those would duplicate in-flight work rather than make steady progress.

The next-smallest remaining item was system-preference dark mode, but the current repository guidance makes that change ambiguous:

- `TechnicalDebt.md` frames dark mode as intentionally deferred work.
- `openspec/specs/design-tokens/spec.md` says the default palette with no `data-palette` attribute is **Reverie**.
- `app/lib/palette-storage.ts` currently uses **Inkwell** as the first-run fallback when there is no stored preference.

Adding `prefers-color-scheme` support now would require choosing which palette wins for first-time users and whether the app should follow later operating system theme changes. That is a product and specification decision, not a purely mechanical cleanup.

## Exact blockers

1. The expected first-run palette behavior is unclear:
   - OpenSpec says the no-attribute default is Reverie.
   - Runtime code currently defaults first-run users to Inkwell.
   - The technical debt item suggests Midnight for dark-mode users, but does not define when or how that should apply.
2. The desired scope of dark-mode support is undefined:
   - Initial-load only
   - Live sync with operating system theme changes
   - A persistent explicit "system" mode alongside manual palette choices
3. Precedence rules are unspecified:
   - Stored palette choice vs. system preference
   - Existing first-run fallback vs. dark-mode fallback
4. The safest low-risk alternatives are already covered by open draft pull requests, so duplicating them would add review noise rather than new value.

## Specific questions that need answers

1. Should first-time users with `prefers-color-scheme: dark` automatically start on the Midnight palette?
2. If yes, should that happen only on first load, or should the app keep following operating system theme changes until the user manually selects a palette?
3. Once a user manually picks a palette, should system preference ever override that choice?
4. Should the OpenSpec design-token spec be updated so the documented default behavior matches the intended runtime behavior?

## Smallest next step to unblock this

Choose one of the following before implementation:

1. **Review and merge or close the existing low-risk draft pull requests** for error-color tokenization (#88) and standalone output mode (#64), to clear the already-understood debt items.
2. **Record a short product/spec decision** for system dark mode covering:
   - first-run behavior,
   - live-sync vs. initial-load-only behavior, and
   - precedence between stored palette choices and system preference.

Once those answers exist, the implementation should stay localized to:

- `app/lib/palette-storage.ts`
- the palette bootstrap script in that same module
- optionally `app/components/PalettePicker.tsx` if live sync is desired

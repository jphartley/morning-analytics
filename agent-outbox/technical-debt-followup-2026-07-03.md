# Technical debt follow-up — 2026-07-03

## Technical debt item considered

- **Error state colors not tokenized**: `ErrorState.tsx` and the save-error toast still use hardcoded `bg-red-*` and `text-red-*` classes instead of shared semantic tokens.

## Why it could not be completed confidently

- This was the easiest low-risk code candidate in `TechnicalDebt.md` because it is localized, non-behavioral, and easy to validate with linting.
- However, the repository already has a long-running stack of open draft pull requests for this exact item, including the newest draft **#90: "Tokenize semantic error colors"** and many earlier duplicates.
- Opening another implementation pull request for the same debt item would add review noise, risk diverging fixes, and would not clearly reduce the backlog.
- I checked the next safest remaining code candidate, **Next.js standalone output mode**, and found that it is also already represented by open draft pull requests (**#51**, **#61**, and **#64**).
- The remaining unchecked debt items are either security-sensitive, larger than a one-shot cleanup, or require product decisions:
  - email confirmation enforcement
  - password reset
  - account deletion
  - server-side route protection and server-side session verification
  - auth metrics
  - palette preference sync to the database
  - system-preference dark mode

## Exact blockers

1. Multiple unresolved draft pull requests already target the only clearly safe small debt items.
2. This automation cannot confidently determine which existing draft should be continued, superseded, or closed.
3. Duplicating those changes would create more churn than progress.

## Specific questions that need answers

1. Should the existing draft pull requests for error-color tokenization be reviewed and merged, or closed as stale?
2. Should the existing draft pull requests for standalone output mode be reviewed and merged, or closed as stale?
3. Does the team want this automation to skip debt items that already have any open draft pull request, even if the draft appears stale?

## Smallest next step a human could take

1. Triage the existing draft pull requests for the two safest debt items:
   - error-color tokenization: latest is **#90**
   - standalone output mode: drafts **#51**, **#61**, and **#64**
2. Keep one draft per item or close them all if none should proceed.
3. After that cleanup, rerun the daily automation so it can pick an actually unclaimed technical debt item.

## Context

The fixed `cleanup-first-use-test-accounts.js` command safely cleaned a known
historical set but cannot be reused for later disposable accounts. Its
storage-first ordering is required because analysis rows do not cascade from
Supabase Auth, while profiles and contextual-memory rows do. See `proposal.md`
for motivation and the capability spec for required behavior.

## Goals / Non-Goals

**Goals:**

- Enable exact, repeatable selection of future test accounts without source
  edits.
- Make destructive execution difficult to trigger accidentally.
- Preserve data isolation while collecting and removing only analysis-owned
  image paths.

**Non-Goals:**

- Automatically classifying accounts as tests based on email, role, or
  inactivity.
- A user-facing account-deletion feature, bulk wildcard selection, backup, or
  restore workflow.

## Decisions

- Add a separate `cleanup-test-accounts.js` command rather than weakening the
  fixed historical script. The old script stays an auditable record and the
  generic command has an obvious, descriptive invocation.
- Accept one or more `--email <address>` pairs and no selector or wildcard
  arguments. Explicit account selection remains reviewable in terminal history
  and prevents accidental broad deletion.
- Make a command with emails alone a dry run. Require both `--apply` and
  `--confirm-delete` to mutate, so a copy of a preview command cannot delete
  accounts.
- Resolve every requested account and create the complete plan before mutation.
  Missing accounts abort the run rather than silently skipping targets.
- Carry forward storage-first cleanup: enumerate each analysis folder, combine
  listed objects with validated stored paths, hard-scope paths to that analysis,
  delete storage objects, delete analysis rows, verify zero rows, then delete
  Auth. Per-account failures preserve that account's Auth user.

Alternatives considered:

- An inactivity-days selector could delete real but infrequent users and is
  intentionally excluded.
- A single `--apply` switch is simpler but too easy to reuse accidentally for
  a generic administrative deletion command.

## Risks / Trade-offs

- The operator can name a real account as an explicit target → the two-stage
  preview plus separate confirmation makes the selection visible before delete.
- Storage and database changes are not one transaction → storage-first order
  and account-level failures preserve Auth until core application data is gone.
- Requiring repeated flags is less convenient than a wildcard selector → it is
  an intentional safeguard for a destructive operation.

## Migration Plan

1. Add the generic script and focused tests.
2. Run static tests and a preview against explicitly designated disposable
   accounts.
3. Operators use the preview command before deciding whether to add both
   destructive flags. No deployment or schema migration is required.

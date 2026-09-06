## Context

The existing `scripts/cleanup-history.js` removes general history but is not
account-aware. The designated test users own eight analyses. `profiles`,
`memories`, and `memory_evidence` reference `auth.users` with cascading
deletes; `analyses.user_id` does not have that database foreign key. Generated
image references can appear in both `image_paths` and
`image_generation_batches`.

See `proposal.md` and `specs/test-account-cleanup/spec.md` for the required
operator behavior.

## Goals / Non-Goals

**Goals:**

- Make the exact account set reviewable in source and immutable at invocation.
- Provide safe preview and explicit execution modes.
- Prevent Auth deletion whenever removal of the same account's storage or
  analysis data fails.

**Non-Goals:**

- General-purpose user deletion, a UI workflow, or deletion of any accounts
  other than the four confirmed test accounts.
- Restoring deleted data or cleaning unreferenced storage objects.

## Decisions

- Use a standalone CommonJS Node script under `scripts/`, following the
  repository's current admin-script convention and loading `app/.env.local`.
  This avoids adding runtime routes or deploying an administrative capability.
- Keep target emails as a frozen constant rather than CLI input. An arbitrary
  email parameter would turn a narrowly reviewed test cleanup into a general
  destructive account-deletion tool.
- Require `--apply` for mutation; all other accepted invocations are dry runs.
  This works in interactive and CI-like terminals without prompt handling.
- Resolve all four Auth accounts before mutation. A missing target aborts early
  rather than producing a partial, surprising cleanup.
- For each account, fetch only data needed to enumerate image paths and count
  related records. Deduplicate paths from `image_paths` and valid
  `image_generation_batches`, delete those storage objects first, then delete
  analyses, then invoke Supabase Auth admin deletion. This is the safest
  ordering available across storage and database systems that do not share a
  transaction.
- Stop processing the failed account before Auth deletion if a precondition or
  cleanup operation fails. Other accounts may already have been fully removed;
  the final report makes that explicit and a later dry run can show the state.

Alternatives considered:

- Deleting Auth users first would leave orphaned analyses and image objects
  because analyses do not cascade from Auth.
- Deleting database rows before storage risks leaving orphaned images when a
  storage removal fails.
- A generic `--email` option offers convenience but exceeds the requested,
  auditable cleanup scope.

## Risks / Trade-offs

- Storage and database mutations cannot be atomic → use deterministic ordering,
  account-level failure boundaries, and a detailed final report.
- A network failure after a successful remote mutation can make the local result
  uncertain → re-run the default dry run to determine what remains before retrying.
- The source file contains test email addresses → they are intentionally scoped
  test identifiers, but the script must never log credentials or journal data.

## Migration Plan

1. Add the script and its focused tests.
2. Run tests and the default dry run against the configured project.
3. Review the dry-run account and data counts, then run with `--apply` only
   when the operator approves deletion.

Rollback is not available after the `--apply` operation; restore requires a
database backup if data was deleted in error. Removing the script is a normal
source rollback and does not restore deleted accounts.

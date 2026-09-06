## Why

First-use testing creates disposable Supabase Auth accounts that can also own
analyses, generated images, and contextual-memory records. Removing only an
Auth user can leave application data and storage objects behind, making manual
test-account cleanup incomplete.

## What Changes

- Add a repository-admin script that targets an explicit, fixed list of the
  four confirmed test-account email addresses.
- Make the script dry-run by default, require an exact confirmation flag before
  deletion, and report its work without printing credentials or journal text.
- Remove account-owned analysis rows and their referenced image objects before
  deleting each Supabase Auth user; rely on database cascades for profiles and
  contextual-memory records.
- Add focused automated coverage for argument validation and cleanup planning.

## Capabilities

### New Capabilities

- `test-account-cleanup`: Safe, explicitly scoped cleanup of designated
  disposable test accounts and their related application data.

### Modified Capabilities

- None.

## Impact

- Adds an administrative Node.js script under `scripts/` and a test file.
- Uses the existing `@supabase/supabase-js` service-role client and
  `app/.env.local` configuration; no application runtime or schema change is
  required.

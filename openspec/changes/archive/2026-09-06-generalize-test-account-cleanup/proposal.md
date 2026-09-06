## Why

The existing cleanup command is deliberately limited to one historical set of
four test accounts. Future testing needs the same safe cleanup behavior without
requiring a new script or an ad-hoc destructive command for every account set.

## What Changes

- Add a generic, command-line account cleanup tool that accepts one or more
  explicit email addresses.
- Make the generic command preview-only by default and require both an apply
  flag and a separate destructive confirmation flag for mutation.
- Reuse the storage-first, analysis-before-Auth deletion behavior and retain
  per-account outcome reporting.
- Preserve the fixed first-use cleanup command as a narrow historical tool.

## Capabilities

### New Capabilities

- `generic-test-account-cleanup`: Safe cleanup of operator-specified,
  disposable test accounts through an explicit command-line workflow.

### Modified Capabilities

- None.

## Impact

- Adds a standalone Node.js admin script and focused Node tests under `scripts/`.
- Uses existing Supabase service-role configuration; no schema, runtime, or
  Railway environment-variable changes are required.

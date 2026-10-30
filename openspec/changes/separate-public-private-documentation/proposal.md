## Why

Public project documentation needs a clear publication boundary. Sensitive
assessments and operational evidence must stay in private storage.

## What Changes

- Document public and private content categories and a local private layout.
- Relocate sensitive records while preserving their local contents.
- Remove their tracked paths and prevent accidental reintroduction.
- Refactor public documentation to retain generic procedures and behavior.
- Add a staged-path check to the existing secret-scanning hook.

## Capabilities

### New Capabilities
- `documentation-publication`: Public documentation and private record handling.

### Modified Capabilities
None.

## Impact

Documentation, contributor instructions, ignore rules and the local pre-commit
hook. No application behavior, environment variables or database migrations change.
Previously published Git history is outside this change.

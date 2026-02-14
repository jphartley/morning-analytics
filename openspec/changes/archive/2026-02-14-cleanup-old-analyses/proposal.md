## Why

During development and testing, numerous analysis records and their associated AI-generated images accumulate in Supabase storage, consuming S3 quota. We need an admin-only cleanup mechanism to delete old test data while preserving recent analyses, preparing the system for multi-user operation where storage management becomes critical.

## What Changes

- Add a CLI command that securely deletes old history items and their associated images
- Implement retention logic: keep only the N most recent history items (configurable parameter)
- Cascade-delete all S3 images associated with deleted history records
- Add confirmation step before deletion to prevent accidental data loss
- Implement error logging without rollback (continue despite individual failures)

## Capabilities

### New Capabilities
- `history-cleanup`: CLI-based admin tool to manage history storage, delete old records and images, with configurable retention policy

### Modified Capabilities
<!-- No existing specs are being modified -->

## Impact

- **Code**: New Node CLI script in `/scripts/cleanup-history.js`
- **Dependencies**: Supabase client (already available)
- **Data**: Direct deletion from Supabase (history table and S3 storage)
- **Future**: Designed to transition to authenticated API endpoint when user system is implemented

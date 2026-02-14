## 1. Setup

- [x] 1.1 Create `/scripts/cleanup-history.js` file with basic Node.js structure
- [x] 1.2 Import Supabase client and load environment variables from `.env.local`
- [x] 1.3 Implement CLI argument parsing to accept `--keep` parameter
- [x] 1.4 Add error handling for missing `--keep` parameter

## 2. Deletion Logic

- [x] 2.1 Implement function to query all history items sorted by creation date (newest first)
- [x] 2.2 Implement logic to identify items beyond the N most recent (to be deleted)
- [x] 2.3 Handle edge case: if `--keep` value exceeds total items, abort with message
- [x] 2.4 Implement confirmation prompt: display counts and require "yes" input before proceeding
- [x] 2.5 Implement function to delete marked items from `analysis_history` table

## 3. Image Deletion

- [x] 3.1 Query storage paths for images associated with deleted history items
- [x] 3.2 Implement function to delete S3 images via Supabase storage client
- [x] 3.3 Add error logging for individual image deletion failures (continue on error)

## 4. Completion & Reporting

- [x] 4.1 Implement result reporting: print count of deleted items and images
- [x] 4.2 Add logging for errors encountered during deletion
- [x] 4.3 Ensure script exits gracefully after completion
- [x] 4.4 Test script locally with `--keep 2` to verify deletion works (verify in Supabase UI)

## 5. Documentation

- [x] 5.1 Add usage comment at top of script: `node scripts/cleanup-history.js --keep 5`
- [x] 5.2 Add README entry or update CLAUDE.md with cleanup script documentation

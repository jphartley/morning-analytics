## Context

Currently, development and testing create numerous history items and their associated S3 images in Supabase. These accumulate over time and consume storage quota. There is no user authentication system yet, but one is planned. We need a safe way to clean up test data without creating a public endpoint that could be exploited once users exist.

The app stores:
- **History records**: `analysis_history` table in Supabase
- **Generated images**: S3 bucket managed by Supabase (4 images per analysis)
- **Relationships**: Each history item references its associated images via storage paths

## Goals / Non-Goals

**Goals:**
- Provide a CLI-based cleanup tool for admin use
- Delete old history items and cascade-delete their associated S3 images
- Keep only the N most recent items (configurable)
- Require confirmation before destructive operations
- Log what was deleted without requiring rollback capability
- Design to transition to authenticated API endpoint in future

**Non-Goals:**
- User-based retention policies (all admins see same retention policy)
- Scheduled/automated cleanup (manual execution only)
- UI-based deletion interface
- Partial/selective deletion (all-or-nothing by recency)

## Decisions

**Decision 1: CLI Script (not API endpoint)**
- **Chosen**: Node.js CLI script in `/scripts/cleanup-history.js`
- **Why**: Requires local/server access only, prevents public exploitation before user auth exists
- **Future**: When users arrive, wrap the same deletion logic with auth checks and expose via API endpoint
- **Alternative considered**: HTTP endpoint (rejected—creates security risk during multi-user transition)

**Decision 2: Execution Model**
- **Chosen**: Script imports Supabase client and runs directly against database
- **Why**: Simplest for local development environment
- **Assumption**: Script runs on a machine with database credentials available (local or server environment)
- **Alternative considered**: Lambda/serverless (rejected—overkill for manual admin tool)

**Decision 3: Deletion Logic**
- **Chosen**: Query all history, sort by creation date descending, delete items beyond N most recent
- **Why**: Simple, deterministic, aligned with user request ("keep 5 most recent")
- **Alternative considered**: Age-based (delete older than X days) - rejected because test data accumulation is bursty, recency-based is more predictable

**Decision 4: Image Deletion**
- **Chosen**: Cascade delete all S3 images associated with each deleted history record
- **Why**: Images are "children" of history items; deleting history means deleting its images
- **Implementation**: Query image storage paths from deleted records, delete from Supabase storage

**Decision 5: Confirmation & Error Handling**
- **Chosen**: Print "About to delete X items and Y images. Type 'yes' to confirm:" before execution; log errors and continue
- **Why**: Prevents accidental data loss; errors don't block completion (partial success is acceptable)
- **Alternative considered**: Rollback on error (rejected—complexity not warranted, logging errors is sufficient)

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Accidental deletion of all data | Confirmation step + clear messaging before deletion |
| Partial failure (some images deleted, history not) | Log errors but continue; accept partial success |
| Future user-based deletion requests | Designed as foundation; can add auth wrapper later without rewriting logic |
| S3 cost if images aren't properly deleted | Verify deletion in Supabase UI after first run; add logging to confirm success |
| Script breakage if Supabase client API changes | Pin `@supabase/supabase-js` version in package.json |

## Migration Plan

**Initial deployment:**
1. Write script to `/scripts/cleanup-history.js`
2. Test on local machine with small retention value (e.g., `--keep 2`) to verify deletion works
3. Document usage: `node scripts/cleanup-history.js --keep 5`
4. Run manually during development as needed

**Future transition to authenticated endpoint:**
- When user auth is added, extract the deletion logic into a reusable function
- Wrap function with `requireAdmin()` check
- Expose as API route `/api/admin/cleanup-history`
- Keep CLI script as fallback for emergency cleanup

## Open Questions

- Should the script use environment variables for Supabase connection, or read from `.env.local`? → Assume `.env.local` with existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Should deleted counts be printed, or silent? → Print summary (e.g., "Deleted 47 items and 188 images")

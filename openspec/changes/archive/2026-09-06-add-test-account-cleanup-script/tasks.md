## 1. Safe cleanup command

- [x] 1.1 Add a fixed-scope, dry-run-first test-account cleanup script that resolves all four designated Auth users and reports only account metadata; verify it rejects unexpected arguments and missing targets before mutation.
- [x] 1.2 Implement ordered related-data cleanup for referenced image storage, analyses, and Auth users with per-account error handling and post-delete verification; verify the script returns a failing status for incomplete cleanup.

## 2. Validation and operator handoff

- [x] 2.1 Add focused automated tests for destructive-flag validation and image-path collection; verify them with Node's test runner.
- [x] 2.2 Validate the OpenSpec change and run the cleanup command in dry-run mode against the configured Supabase project; verify no mutation occurs and the four-target preview is reported.

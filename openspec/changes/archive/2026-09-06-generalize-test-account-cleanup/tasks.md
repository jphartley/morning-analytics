## 1. Generic cleanup command

- [x] 1.1 Add a reusable cleanup command accepting repeated explicit email targets with default dry-run behavior; verify invalid, missing, and duplicate inputs are handled safely.
- [x] 1.2 Require both apply and destructive-confirmation flags, then implement storage-first related-data deletion with per-account verification; verify Auth deletion is withheld after a failure.

## 2. Validation and handoff

- [x] 2.1 Add focused Node tests for argument parsing, target de-duplication, and owned-image collection; verify them with Node's test runner.
- [x] 2.2 Validate the OpenSpec change and run an empty live preview only if it does not require selecting a real account; verify the generic command's help and dry-run path locally.

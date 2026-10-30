## Context

Git ignore rules do not affect files already tracked. Security-related material
can also appear in archived plans and ordinary runbooks.

## Decisions

Use an ignored `private/` root, with legacy ignore rules as a migration guard.
Preserve private records and original runbook copies locally before refactoring
public documents. Public documentation describes supported behavior and generic
procedures; it does not link to missing private documents.

Remove migrated paths from the index. Add a hook check against ignore rules for
staged additions and modifications, including force-added files. Allow deletions.
Retain the existing Gitleaks check. Neither check replaces content review.

Keep the historical commits intact. A history rewrite changes shared references
and requires separate explicit authorization. Private local files need their own
access-controlled backup; Git does not provide one.

## Verification

Check ignored paths and the resulting index, inspect public references, exercise
the hook check with synthetic public/private paths and deletion cases, validate
OpenSpec and scan the proposed public changes for secrets with redacted output.

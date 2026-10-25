## Why

The journal editor uses dependency versions with published paste-handling and Markdown parsing vulnerabilities. Users must be able to paste journal entries safely while retaining headings and bold; converting all pasted content to plain text would lose required formatting.

## What Changes

- Update the Tiptap dependency family, ProseMirror and the Markdown parsing dependencies to compatible releases containing the reviewed security fixes. Verify the versions actually resolved in the lockfile.
- Clean formatted clipboard content before the editor parses it. Preserve headings, bold, italic, lists, paragraphs and line breaks, while removing executable content, hidden editor metadata and unsupported formatting.
- Preserve raw Markdown paste, typed formatting shortcuts, Markdown storage and formatted history display.
- Apply the same content cleanup to external HTML dropped into the editor so it cannot bypass the paste boundary.
- Verify formatting fidelity, unsafe-content removal and existing automatic-analysis behavior with synthetic fixtures and local browser checks.

This is the user's selected package-update and paste-hardening scope. Entry-size limits and a replacement editor are deferred. This proposal does not claim that arbitrary code execution has been reproduced in the current application configuration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markdown-journal-input`: Add a restricted formatted-paste and external-drop contract, preserving supported formatting and the existing Markdown interface.

## Impact

- Expected implementation surface: `app/components/JournalInput.tsx`, a clipboard-cleanup helper under `app/lib/`, focused tests, `app/package.json` and `app/package-lock.json`.
- Introduce a maintained HTML sanitizer such as DOMPurify with an explicit allowed subset; validate its selected version and configuration during implementation.
- Update the security tracker and related debt documentation during implementation to record exact fixes, verification and remaining findings.
- No database migration, stored-content conversion or public API change is expected.
- **Environment / Railway variables:** None new, changed or removed. The dependency and application changes will require the normal application deployment after review.

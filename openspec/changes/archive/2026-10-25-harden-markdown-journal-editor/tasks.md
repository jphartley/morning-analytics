## 1. Review and resolve dependencies

- [x] 1.1 Confirm implementation approval for the proposal, design and specification; verify the review record covers formatting-preserving clipboard cleanup and the dependency scope before changing application files. Approved by the user's explicit `openspec-apply-change` invocation after the four planning artifacts were presented.
- [x] 1.2 Read `docs/node-runtime-runbook.md`, review current publisher advisories and select compatible editor/sanitizer versions; verify the chosen versions meet the reviewed floors, have no unresolved scoped advisories, and satisfy `tiptap-markdown` peer requirements, recording any remaining caveats. Selected Tiptap 3.32.0, ProseMirror View 1.42.8, Markdown-it 14.3.3, linkify-it 5.0.2 and DOMPurify 3.4.17; the updated audit contains no scoped editor/sanitizer findings. Other findings remain open.
- [x] 1.3 Update the Tiptap family, resolved ProseMirror View, Markdown-it and linkify-it copies, and add the selected sanitizer; verify installation, resolved versions and `npm run check:lockfile-registry`, correcting registry URLs only if needed. Clean installation and dependency-tree verification passed under Node 22.23.4; registry check passed.

## 2. Implement restricted clipboard handling

- [x] 2.1 Add a dedicated cleanup helper using a maintained sanitizer and explicit allowed tags/attributes; verify focused tests remove active content, resource URLs, event handlers, arbitrary styles and hidden clipboard metadata while retaining readable text.
- [x] 2.2 Normalize semantic headings, bold, italic, lists and supported document clipboard representations into the restricted subset; verify synthetic browser/Word/Docs fixtures, explicit normal weight, h4-h6 normalization and ordered-list numbering.
- [x] 2.3 Integrate cleanup before HTML clipboard interpretation for paste and external drop, and align editor extensions with the supported subset; verify boundary tests demonstrate that raw metadata never reaches the editor parser and that both entry paths receive cleanup.
- [x] 2.4 Preserve raw Markdown and plain-text paste, safe fallback, selection replacement and undo; verify focused editor tests cover formatted HTML, Markdown clipboard text, empty cleaned content, cleanup failures and disabled editing without exposing journal content in diagnostics.
- [x] 2.5 Preserve existing paste-trigger bookkeeping and final-text word counting; verify successful threshold-crossing paste submits once in each effective mode, rejected paste leaves no stale trigger, and typing or external drop does not acquire automatic-analysis behavior.

## 3. Verify the integrated writing experience

- [x] 3.1 Verify semantic Markdown round trips and saved-history rendering for headings, bold, italic and lists, including existing stored entries; confirm output remains Markdown and no database conversion is required.
- [x] 3.2 Run the focused security/editor tests, the app test suite, lint, required-runtime build and lockfile-registry check; record commands, Node version, outcomes and any blocking failures without claiming checks that could not run.
- [x] 3.3 Review the updated app lockfile assessment and bounded synthetic Markdown-processing regression evidence; verify the scoped fixes are resolved and distinguish unrelated remaining dependency findings from this change's closure.
- [x] 3.4 Run local browser checks with mock providers, synthetic content, harmless execution markers and external resource requests blocked; verify no marker execution or embedded-resource requests, formatting preservation, safe failures, selection replacement, undo and exactly-once automatic analysis. Complete the repository's analysis rendering, mock image generation and history save/load baseline without paid provider calls or production data.

## 4. Document and present for review

- [x] 4.1 Update `docs/security-remediation-2026-10.md`, `SecurityDebt.md` and `TechnicalDebt.md` where their editor status needs correction; verify they record actual resolved versions and checks, preserve unrelated open findings, and state that entry limits remain deferred without claiming complete security coverage.
- [x] 4.2 Present the implementation for user review with a running clickable local dev-server URL and a short paste/save/reopen checklist; verify the server is ready, or explicitly explain why a review link is unavailable and provide the next action. Include **Environment / Railway variables: none new, changed or removed** and the normal deployment requirement.

Commit, push, deployment and archiving are separate follow-up actions after the relevant review. Read `docs/gitleaks-runbook.md` and complete the applicable secret scan before any later commit or push.

## Verification record, 25 October 2026

- User authorized implementation by explicitly invoking `openspec-apply-change` after reviewing the planning artifacts.
- All 14 tasks are complete. The user confirmed "It works. All tested." on 25 October 2026 and explicitly authorized spec sync, archive, commit and push. Production deployment verification remains separate.
- Final app tests: 269 passed, 21 database integration tests skipped; includes 30 new clipboard/editor tests. Lint, TypeScript/webpack production build and public lockfile-registry checks passed under Node 22.23.4.
- Default Turbopack build remains locally blocked by a CSS worker port-binding permission error, including an escalated attempt; it is not reported as passed.
- Scoped lockfile scan: no editor, Markdown, sanitizer or jsdom findings; 5 High / 4 Moderate app package entries remain in separate dependency follow-ups.
- Chrome verified formatted and Markdown paste, representative document heading/emphasis conventions, cleanup/fallback/failure, selection/undo, external drop, native copy, exactly-once submission of the new journal, four mock images and saved-history reload. No browser errors, execution-marker changes or embedded external requests were observed.
- Bounded synthetic Markdown reference parsing: approximately 333 KB processed in 8.6 ms after the update, compared with 384.4 ms before, using Node 22.23.4. This does not establish a general input-size policy.
- Synthetic review app: http://127.0.0.1:3101; isolated fixture at 127.0.0.1:54330. Login `smoke@example.test`, password `local-fixture-only`. No production services or paid providers were used.
- Durable evidence summary: `docs/security-remediation-2026-10.md#editor-hardening-verified-locally-25-october-2026`; temporary browser reports/screenshots: `/tmp/morning-editor-browser/`.
- **Environment / Railway variables:** none new, changed or removed.

## Review and archive closure, 25 October 2026

- User testing passed and release finalization was explicitly authorized.
- All five added requirements were synced into the main `markdown-journal-input` specification, preserving the existing requirements and scenarios. Strict validation passed for all 41 main specs and this change.
- Archived as `2026-10-25-harden-markdown-journal-editor`, preserving `.openspec.yaml` and all planning artifacts.
- Application test/build/browser results are recorded above; no application code changed during finalization and those passed checks were not repeated.
- Secret scans and remote synchronization are checked as part of the following commit/push operation; production deployment success is not inferred from a push.

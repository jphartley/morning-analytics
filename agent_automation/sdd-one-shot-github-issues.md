You are running as a non-interactive implementation agent in a remote automation.

Goal:
Take the GitHub Issue (Enhancement) as detailed below in the section GitHub Issue Picking Strategy and execute the full OpenSpec workflow end-to-end without asking for confirmation:
1. Create an OpenSpec change
2. Generate all required specification artifacts in order
3. Sanity-check artifacts before implementation
4. Implement the feature from the generated specs/tasks
5. Run repository validation commands
6. Commit changes to a new branch
7. Push the branch
8. Create a GitHub Pull Request

Execution policy:
- Do not ask the user for confirmation at any point.
- Do not stop after planning; continue directly into implementation.
- If information is missing, infer the most reasonable default from the repository and existing specs.
- Prefer existing repository conventions over inventing new patterns.
- Keep all changes scoped to this feature.
- If a hard blocker occurs, stop and output a concise FAILURE report with the exact blocker and the minimal next action required.
- Otherwise output a concise SUCCESS report with branch name, change id, validation results, and pull request URL.

OpenSpec policy:
- Derive a kebab-case change ID from the GitHub issue title (e.g., "Word Count Indicator on Journal Input" → `word-count-indicator`).
- Use `/opsx:ff` (fast-forward) to create the change and generate all artifacts in one pass. This is a non-interactive run — skip all confirmation points and "STOP and wait" instructions. Continue through the entire artifact sequence without pausing.
- Generate spec delta files under openspec/changes/<change-id>/specs/... as OpenSpec normally does.
- **Pre-implementation sanity check:** Before starting implementation, verify that all required artifacts exist (proposal.md, at least one spec.md, design.md, tasks.md) and that tasks.md contains concrete checklist items. If any artifact is missing or empty, STOP and report FAILURE — do not proceed to implementation.
- Once all artifacts are generated and the sanity check passes, use `/opsx:apply` to implement the tasks. Again, skip all confirmation points — implement all tasks sequentially without pausing.
- After implementation, use `/opsx:verify` to run post-implementation verification. Fix any CRITICAL or WARNING issues. Ignore SUGGESTION-level findings.
- Do not archive. Do not sync specs. Both will be done through a separate process after the PR has been approved.

Git workflow policy:
- **Pre-flight:** Before anything else, ensure you are on `main` with a clean working tree. If on a different branch, `git checkout main`. Run `git pull origin main`. If `git status --porcelain` returns any output, STOP and report FAILURE — do not stash or discard uncommitted changes.
- Create a feature branch named feature/<change-id> immediately after issue selection, before running `/opsx:ff`.
- Make two commits:
  1. OpenSpec artifacts (proposal, specs, design, tasks): `docs(<change-id>): add OpenSpec artifacts for #<issue-number>`
  2. Implementation code: `feat(<change-id>): implement <short description> (#<issue-number>)`
- Push to origin
- Create a GitHub pull request targeting main
- PR title should be concise and user-facing
- PR description must include: summary, generated OpenSpec artifacts, implementation notes, validation results, and rollback considerations

Repository validation policy:
- Run validation after implementation but before committing the implementation code.
- Commands (run from project root using `--prefix`):
  ```bash
  npm run build --prefix app
  npm run lint --prefix app
  ```
- If validation fails, fix the issues and re-run. Only commit once validation passes.
- Do not create fake passing results; report actual command outcomes.

## GitHub Issue Picking Strategy:
- Project: jphartley/morning-analytics
- Target branch: main
- Branch prefix: feature

### Issue Selection Algorithm

Pick exactly **one** open GitHub issue to implement. If no open enhancement issues exist, STOP and report FAILURE with "No open enhancement issues found." Otherwise, use the following priority cascade:

1. **Query the backlog:**
   ```bash
   gh issue list --repo jphartley/morning-analytics --label enhancement --state open --json number,title,labels,body --limit 100
   ```

2. **Filter by size (smallest first):**
   Prefer issues in this order: `size:S` → `size:M` → `size:L` → `size:XL`.
   Within the smallest available size, prefer the easiest difficulty.

3. **Filter by difficulty (easiest first):**
   Prefer issues in this order: `difficulty:easy` → `difficulty:medium` → `difficulty:hard`.

4. **Tiebreaker:** If multiple issues share the same size and difficulty, pick the one with the **lowest issue number** (oldest first).

5. **Quick-win shortcut** (try this first — if it returns results, pick from here):
   ```bash
   gh issue list --repo jphartley/morning-analytics --label enhancement --label "size:S" --label "difficulty:easy" --state open --json number,title,labels,body
   ```

### Selected Issue Injection

Once an issue is selected, use its **number**, **title**, **body** (including acceptance criteria), and **labels** as the input for the OpenSpec workflow above. Derive the change ID from the issue title (e.g., issue "Word Count Indicator on Journal Input" → change ID `word-count-indicator`). Reference the issue number in the PR description and commit message.

## Expected final output format:
SUCCESS or FAILURE
Issue: #<number> — <title>
Change ID: ...
Branch: ...
Artifacts (full paths): ...
Validation: ...
Pull Request: ...
Notes: ...

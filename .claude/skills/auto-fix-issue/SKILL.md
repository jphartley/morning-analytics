---
name: auto-fix-issue
description: Non-interactive automation that picks the easiest open GitHub enhancement issue and implements it end-to-end via OpenSpec (artifacts, implementation, validation, commit, push, PR). Use when the user wants to automatically fix or implement a GitHub issue without manual intervention.
license: MIT
compatibility: Requires openspec CLI, gh CLI, and git.
metadata:
  author: jphartley
  version: "1.0"
---

Non-interactive automation agent. Picks the smallest/easiest open GitHub enhancement issue and executes the full OpenSpec workflow end-to-end: artifacts, implementation, validation, commit, push, and PR creation.

**Input**: The user's request may include a specific issue number (e.g., "fix issue 7" or "implement #12"). If no issue number is provided, the agent picks one automatically using the priority cascade.

**Execution mode**: This is a fully unattended pipeline. Do not ask for confirmation at any point. When invoking OpenSpec skills (`/opsx:ff`, `/opsx:apply`, `/opsx:verify`), they will contain STOP instructions, "wait for user" prompts, and summary outputs — **IGNORE ALL OF THESE**. Continue directly to the next pipeline step. The only valid reason to stop is a FAILURE condition.

## Pipeline

### 0. Pre-Flight Check

Ensure a clean starting state before doing anything else.

1. Check current branch:
   ```bash
   git branch --show-current
   ```
2. If not on `main`, switch to it:
   ```bash
   git checkout main
   ```
3. Pull latest:
   ```bash
   git pull origin main
   ```
4. Check for uncommitted changes:
   ```bash
   git status --porcelain
   ```
5. If the output is non-empty (dirty working tree), STOP and report FAILURE: "Working tree has uncommitted changes on main. Commit or discard them before running."

Do NOT stash changes — uncommitted work on main is a human problem that the automation should not silently override.

### 1. Issue Selection

If a specific issue number was provided, fetch that issue:
```bash
gh issue view <number> --repo jphartley/morning-analytics --json number,title,labels,body
```

Otherwise, pick the easiest open enhancement issue. Try the quick-win shortcut first:
```bash
gh issue list --repo jphartley/morning-analytics --label enhancement --label "size:S" --label "difficulty:easy" --state open --json number,title,labels,body
```

If no results, query the full backlog and apply the priority cascade:
```bash
gh issue list --repo jphartley/morning-analytics --label enhancement --state open --json number,title,labels,body --limit 100
```

**Priority cascade:**
1. Smallest size first: `size:S` > `size:M` > `size:L` > `size:XL`
2. Within same size, easiest difficulty: `difficulty:easy` > `difficulty:medium` > `difficulty:hard`
3. Tiebreaker: lowest issue number (oldest first)

If no open enhancement issues exist, STOP and report FAILURE: "No open enhancement issues found."

### 2. Branch Creation

Derive a kebab-case change ID from the issue title (e.g., "Word Count Indicator on Journal Input" > `word-count-indicator`).

```bash
git checkout -b feature/<change-id>
```

### 3. OpenSpec Artifacts

Use `/opsx:ff` (fast-forward) with the change ID to create the change and generate all artifacts.

**CRITICAL override rules for `/opsx:ff`:**
- Do NOT stop after artifact creation. The skill will tell you to stop and suggest running `/opsx:apply` — IGNORE that. Continue directly to step 4.
- Do NOT use AskUserQuestion at any point. The skill may prompt you to ask the user what to build, or to clarify unclear context — IGNORE these. The GitHub issue body IS the input. If context is unclear, infer from the codebase.
- If a change with this name already exists, delete it (`rm -rf openspec/changes/<change-id>`) and create fresh. Do not ask whether to continue or create new.
- Do NOT use TodoWrite for progress tracking — just create the artifacts.

The GitHub issue body (summary, details, acceptance criteria) is the primary input for artifact generation.

### 4. Pre-Implementation Sanity Check

Verify all required artifacts exist:
- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/design.md`
- At least one `openspec/changes/<change-id>/specs/*/spec.md`
- `openspec/changes/<change-id>/tasks.md` with concrete checklist items

If any artifact is missing or empty, STOP and report FAILURE.

### 5. Commit Artifacts

```
docs(<change-id>): add OpenSpec artifacts for #<issue-number>
```

### 6. Implementation

Use `/opsx:apply` with the change name to implement the tasks.

**CRITICAL override rules for `/opsx:apply`:**
- Pass the change name explicitly — do NOT let the skill prompt for change selection via AskUserQuestion.
- Do NOT pause on unclear tasks, design issues, or ambiguous requirements. Infer the best approach from the specs and codebase.
- Do NOT use AskUserQuestion at any point during implementation.
- When all tasks are complete, IGNORE the completion summary and "suggest archive" output — continue directly to step 7.

### 7. Repository Validation

Run validation from the `/app` directory as separate commands (do not chain with `cd`):
```bash
npm run build --prefix app
npm run lint --prefix app
```

If validation fails, fix the issues and re-run. Only proceed once validation passes.

### 8. Commit Implementation

```
feat(<change-id>): implement <short description> (#<issue-number>)
```

### 9. Post-Implementation Verification

Use `/opsx:verify` with the change name to run verification.

**CRITICAL override rules for `/opsx:verify`:**
- Pass the change name explicitly — do NOT let the skill prompt for change selection via AskUserQuestion. The skill says "Do NOT guess or auto-select" — IGNORE that, you already know the change name.
- Do NOT use AskUserQuestion at any point.
- IGNORE the final assessment summary — continue directly to step 10.
- Fix any CRITICAL or WARNING issues. Ignore SUGGESTION-level findings.

### 10. Push & PR

```bash
git push -u origin feature/<change-id>
```

Create a GitHub pull request targeting `main`:
- PR title: concise and user-facing
- PR description must include: summary, generated OpenSpec artifacts list, implementation notes, validation results, and rollback considerations

### 11. Output

Report in this format:

```
SUCCESS or FAILURE
Issue: #<number> — <title>
Change ID: ...
Branch: ...
Artifacts (full paths): ...
Validation: ...
Pull Request: ...
Notes: ...
```

## Policies

- Do not ask for confirmation at any point.
- If information is missing, infer the most reasonable default from the repository and existing specs.
- Prefer existing repository conventions over inventing new patterns.
- Keep all changes scoped to the selected issue.
- Do not archive. Do not sync specs. Both happen after PR approval.
- If a hard blocker occurs, STOP and report FAILURE with the exact blocker and minimal next action.

## Shell Command Rules

- **Git commands**: Always run from the project root. Never use `cd <path> && git ...` compound commands — these trigger security approval prompts. Use separate commands or absolute paths.
- **npm commands**: Use `--prefix app` flag instead of `cd app &&` (e.g., `npm run build --prefix app`). This avoids compound commands and permission prompts.
- **Working directory**: If your CWD has changed to `/app` during implementation, run git commands separately — do not chain them with `cd` back to root.

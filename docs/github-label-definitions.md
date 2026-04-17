# GitHub Label Definitions

This document defines the label taxonomy used on GitHub issues in this repository. Follow these definitions when creating new issues to ensure consistency and enable automation tooling (e.g., AI agents querying issues by label).

## Label Creation Commands

To recreate this full label set on a fresh repo, run:

```bash
# Category labels
gh label create "category:ui-polish" --color "1D76DB" --description "UI polish and visual feedback"
gh label create "category:feature" --color "0E8A16" --description "Small interactive features"
gh label create "category:ux" --color "FBCA04" --description "New user experience improvements"
gh label create "category:analysis" --color "D93F0B" --description "Analysis experience improvements"

# Size labels (T-shirt sizing)
gh label create "size:S" --color "C2E0C6" --description "Small effort (hours)"
gh label create "size:M" --color "FEF2C0" --description "Medium effort (half day)"
gh label create "size:L" --color "F9D0C4" --description "Large effort (1-2 days)"
gh label create "size:XL" --color "E99695" --description "Extra large effort (multiple days)"

# Difficulty labels
gh label create "difficulty:easy" --color "C2E0C6" --description "Straightforward implementation"
gh label create "difficulty:medium" --color "FEF2C0" --description "Some complexity or unknowns"
gh label create "difficulty:hard" --color "F9D0C4" --description "Significant complexity or risk"

# Scope labels
gh label create "scope:frontend" --color "BFD4F2" --description "Client-side changes only"
gh label create "scope:full-stack" --color "D4C5F9" --description "Involves both client and server changes"
```

## Label Taxonomy

### Type Labels (GitHub defaults — kept as-is)

These are the standard GitHub labels. `enhancement` is the primary query key for the feature backlog.

| Label | Color | Hex | Description |
|-------|-------|-----|-------------|
| `enhancement` | ![#a2eeef](https://via.placeholder.com/12/a2eeef/a2eeef.png) | `#A2EEEF` | New feature or request |
| `bug` | ![#d73a4a](https://via.placeholder.com/12/d73a4a/d73a4a.png) | `#D73A4A` | Something isn't working |
| `documentation` | ![#0075ca](https://via.placeholder.com/12/0075ca/0075ca.png) | `#0075CA` | Improvements or additions to documentation |
| `good first issue` | ![#7057ff](https://via.placeholder.com/12/7057ff/7057ff.png) | `#7057FF` | Good for newcomers |
| `help wanted` | ![#008672](https://via.placeholder.com/12/008672/008672.png) | `#008672` | Extra attention is needed |
| `question` | ![#d876e3](https://via.placeholder.com/12/d876e3/d876e3.png) | `#D876E3` | Further information is requested |
| `duplicate` | ![#cfd3d7](https://via.placeholder.com/12/cfd3d7/cfd3d7.png) | `#CFD3D7` | This issue or pull request already exists |
| `invalid` | ![#e4e669](https://via.placeholder.com/12/e4e669/e4e669.png) | `#E4E669` | This doesn't seem right |
| `wontfix` | ![#ffffff](https://via.placeholder.com/12/ffffff/ffffff.png) | `#FFFFFF` | This will not be worked on |

### Category Labels

Identify which area of the product the issue affects. Every issue should have exactly one category label.

| Label | Color | Hex | When to use |
|-------|-------|-----|-------------|
| `category:ui-polish` | ![#1D76DB](https://via.placeholder.com/12/1D76DB/1D76DB.png) | `#1D76DB` | Visual tweaks, animations, layout improvements, loading states |
| `category:feature` | ![#0E8A16](https://via.placeholder.com/12/0E8A16/0E8A16.png) | `#0E8A16` | New interactive capabilities (buttons, shortcuts, persistence, drawers) |
| `category:ux` | ![#FBCA04](https://via.placeholder.com/12/FBCA04/FBCA04.png) | `#FBCA04` | Improvements aimed at new user comprehension and onboarding |
| `category:analysis` | ![#D93F0B](https://via.placeholder.com/12/D93F0B/D93F0B.png) | `#D93F0B` | Improvements to the analysis reading/viewing experience |

**Color rationale:** Categories use distinct, saturated hues (blue, green, yellow, red-orange) so they are visually distinguishable at a glance in the GitHub issue list.

### Size Labels (T-Shirt Sizing)

Estimate of implementation effort. Every issue should have exactly one size label.

| Label | Color | Hex | Meaning |
|-------|-------|-----|---------|
| `size:S` | ![#C2E0C6](https://via.placeholder.com/12/C2E0C6/C2E0C6.png) | `#C2E0C6` | A few hours. Touches 1-2 files. Minimal testing surface. |
| `size:M` | ![#FEF2C0](https://via.placeholder.com/12/FEF2C0/FEF2C0.png) | `#FEF2C0` | Half a day. May touch 2-4 files or introduce a new component. |
| `size:L` | ![#F9D0C4](https://via.placeholder.com/12/F9D0C4/F9D0C4.png) | `#F9D0C4` | 1-2 days. Multiple components, possible backend changes. |
| `size:XL` | ![#E99695](https://via.placeholder.com/12/E99695/E99695.png) | `#E99695` | Multiple days. Cross-cutting changes, new integrations, or schema changes. |

**Color rationale:** Green → yellow → peach → red gradient mirrors increasing effort. Matches the "traffic light" intuition.

### Difficulty Labels

Estimate of implementation complexity and risk. Every issue should have exactly one difficulty label.

| Label | Color | Hex | Meaning |
|-------|-------|-----|---------|
| `difficulty:easy` | ![#C2E0C6](https://via.placeholder.com/12/C2E0C6/C2E0C6.png) | `#C2E0C6` | Clear path to implementation. No unknowns. Pattern exists in the codebase. |
| `difficulty:medium` | ![#FEF2C0](https://via.placeholder.com/12/FEF2C0/FEF2C0.png) | `#FEF2C0` | Some unknowns. May need research, CORS investigation, or new patterns. |
| `difficulty:hard` | ![#F9D0C4](https://via.placeholder.com/12/F9D0C4/F9D0C4.png) | `#F9D0C4` | Significant unknowns, external dependencies, or architectural decisions. |

**Color rationale:** Uses the same green → yellow → peach gradient as size labels for consistency.

### Scope Labels

Where the implementation work lives. Every issue should have exactly one scope label.

| Label | Color | Hex | When to use |
|-------|-------|-----|-------------|
| `scope:frontend` | ![#BFD4F2](https://via.placeholder.com/12/BFD4F2/BFD4F2.png) | `#BFD4F2` | Changes are purely client-side (React components, CSS, localStorage) |
| `scope:full-stack` | ![#D4C5F9](https://via.placeholder.com/12/D4C5F9/D4C5F9.png) | `#D4C5F9` | Changes involve server actions, API calls, database, or external services |

**Color rationale:** Light blue and light purple — calm, neutral tones that don't compete with category colors.

## Issue Body Template

Every issue should follow this structure:

```markdown
## Summary
[One-sentence description of the change]

## Details
[Full description: what to build, why, implementation hints, edge cases]

## Acceptance Criteria
- [ ] [Specific, testable check — something you can verify in the browser]
- [ ] [Another testable check]
- [ ] [Visual verification step]

## Context
- **Size:** S/M/L/XL | **Difficulty:** Easy/Medium/Hard
- **Category:** [Category name]
```

### Writing Good Acceptance Criteria

Acceptance criteria are the "definition of done" for AI automation. They should be:

- **Observable:** Verifiable by looking at the UI or testing an interaction
- **Specific:** "Copy button visible in AnalysisPanel header" not "add a copy feature"
- **Independent:** Each criterion is checkable on its own
- **Testable:** An AI agent (or human) can confirm pass/fail without ambiguity

## Labeling Checklist for New Issues

When creating a new issue, apply exactly one label from each of these four groups plus the type label:

1. **Type:** `enhancement`, `bug`, or `documentation`
2. **Category:** One of `category:ui-polish`, `category:feature`, `category:ux`, `category:analysis`
3. **Size:** One of `size:S`, `size:M`, `size:L`, `size:XL`
4. **Difficulty:** One of `difficulty:easy`, `difficulty:medium`, `difficulty:hard`
5. **Scope:** One of `scope:frontend`, `scope:full-stack`

## Automation Query Examples

```bash
# All feature backlog items
gh issue list --label enhancement

# Quick wins (small + easy)
gh issue list --label enhancement --label "size:S" --label "difficulty:easy"

# All UI polish work
gh issue list --label "category:ui-polish"

# Frontend-only medium difficulty
gh issue list --label "scope:frontend" --label "difficulty:medium"

# JSON output for scripting
gh issue list --label enhancement --json number,title,labels
```

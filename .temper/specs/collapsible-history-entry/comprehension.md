# Comprehension — Collapsible original entry in history view

## 1. The Problem  (the WHY)
- [x] What the problem is — full original entry always renders above the analysis
      in history view, pushing analysis/images below the fold.
- [x] Why the problem existed in the first place — the fresh-analysis and
      history-view rendering paths share the same always-expanded code, even
      though the two moments have opposite information priorities.
- [ ] The different branches / options that were considered

## 2. The Solution  (the WHAT & HOW)
- [ ] What the solution does — taught, not yet quiz-confirmed (component +
      pure helpers mirroring ImagePromptDisclosure).
- [ ] Why it was resolved this way — taught, not yet quiz-confirmed: (1) reset
      via `key={id}` instead of `useEffect`, (2) plain-text preview instead of
      truncated markdown, (3) duplicated date formatter instead of shared util.
- [ ] The edge cases and how they're handled — not yet covered (short-entry
      threshold, expansion persistence within an item).

## 3. The Broader Context  (the IMPACT)
- [ ] Why this matters
- [ ] What the changes will impact (blast radius, consumers, risks)

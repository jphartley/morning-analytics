---
name: "source-command-auto-fix-issue"
description: "Pick the easiest open GitHub enhancement issue and implement it end-to-end via OpenSpec"
---

# source-command-auto-fix-issue

Use this skill when the user asks to run the migrated source command `auto-fix-issue`.

## Command Template

Follow the full instructions in `.Codex/skills/auto-fix-issue/SKILL.md`.

**Input**: Optional argument after `/auto:fix-issue` can be a specific issue number (e.g., `/auto:fix-issue 7`). If no issue number is provided, the agent picks one automatically using the priority cascade.

## Context

The app already uses palette-driven design tokens for its primary surfaces and actions. The remaining hardcoded red classes are all error-oriented UI, including the shared error state, the save-failure toast, auth validation banners, and the history load failure text. They are semantically correct, but they bypass the token system described in `openspec/specs/design-tokens/spec.md`.

## Goals / Non-Goals

**Goals**
- eliminate the remaining hardcoded error color classes
- preserve the current error visuals as closely as practical
- keep error colors palette-independent while still routing them through the token system

**Non-Goals**
- changing error copy or behavior
- introducing palette-specific error hues
- redesigning form validation or toast layouts

## Decisions

### 1. Keep semantic error colors palette-independent

**Decision**: Define the error variables once on `:root` and let all palettes inherit them unchanged.

**Why**: The debt item explicitly calls out these colors as semantic error states rather than palette accents. Tokenizing them improves consistency without forcing each palette to invent its own red scale.

### 2. Use multiple semantic error intensities

**Decision**: Add separate tokens for error text, stronger error text, subtle and stronger error surfaces, and matching border strengths.

**Why**: The current UI uses a few different red intensities (`red-50`, `red-100`, `red-200`, `red-300`, `red-600`, `red-700`, `red-800`). A small set of semantic tokens preserves those differences while avoiding arbitrary values or one-off utilities.

### 3. Migrate all current hardcoded red error surfaces in the app together

**Decision**: Update every current `bg-red-*`, `text-red-*`, and `border-red-*` occurrence found in the app codebase, not only the two examples named in `TechnicalDebt.md`.

**Why**: The debt item is about tokenizing error styling. Leaving the auth banners or history error text on hardcoded reds would keep the same category of debt in place immediately after the PR lands.

## Risks / Trade-offs

- Error colors remain fixed rather than palette-specific. This is intentional and matches the current product direction.
- Token names are slightly more verbose than the core palette tokens, but they make shade intent explicit and keep the implementation readable.

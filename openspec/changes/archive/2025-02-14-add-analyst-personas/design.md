## Context

Currently, Morning Analytics uses a single Jungian analyst system prompt loaded from `docs/prompt.md`. The app supports multiple Gemini model variants via ModelPicker, but the analytical voice is fixed. Users have expressed interest in alternative voices (action-oriented, empathetic) to match their preferences.

**Current State:**
- One system prompt in `docs/prompt.md`
- `lib/gemini.ts` loads it at runtime via `getSystemPrompt()`
- ModelPicker in header selects Gemini model variant
- `analyses` table stores `model_id` but no persona info

**Constraints:**
- Persona selection should be as lightweight as model selection (don't burden the UX)
- Each persona's image prompt must be unique and aligned with its voice
- History needs to store which persona was used (visible only when viewing an entry)
- Default to Jungian to make onboarding effortless
- Backwards compatibility: existing analyses without `analyst_persona` should be gracefully handled

## Goals / Non-Goals

**Goals:**
- Allow users to select from three analyst personas (Jungian, Mel Robbins, Loving Parent)
- Each persona has custom section names, tone, and image guidance
- Persona choice is persisted and visible when viewing analysis history
- Default to Jungian analyst for seamless first-time experience
- Persona picker is as discoverable and effortless as model selection
- Three persona-specific prompts are organized in a `prompts/` directory

**Non-Goals:**
- Creating custom user-defined personas (fixed set of three for MVP)
- Persona as a "mode" that changes existing analyses
- Special UI just for persona selection (reuse picker pattern)
- Migrating existing analyses to assign retrospective personas
- Analytics on persona usage

## Decisions

### 1. Persona Definitions: Separate Files in `prompts/` Directory
**Decision**: Create three files: `prompts/jungian.md`, `prompts/mel-robbins.md`, `prompts/loving-parent.md`

**Rationale:**
- Keeps prompts organized and separate from app code and documentation
- Mirrors the existing pattern of `docs/prompt.md` but in a dedicated location
- Easy to edit, version, and extend personas in the future
- Clean separation of concerns

**Alternatives Considered:**
- Store in `docs/` → clutters documentation with configuration
- Hardcode in `app/lib/prompts.ts` → harder to edit, less modular
- Database-backed → overkill for three fixed personas

### 2. Persona State Management: Add `selectedPersona` to App State
**Decision**: Store persona selection in component state (like `selectedModel`) and pass through server actions

**Rationale:**
- Consistent with existing ModelPicker pattern
- Persona is a user preference per session, not critical state
- No need for persistence across browser sessions (users pick one and stick with it, can change anytime)
- Simpler than database-backed preferences for MVP

**Alternative:** Store in local storage / user preferences table → not needed yet; can add later if required

### 3. Prompt Loading Strategy: Load All Three at Startup
**Decision**: Load all three persona prompts once at server startup into memory

**Rationale:**
- Avoids file I/O on every API call
- Three small files = negligible memory overhead
- Faster response time for analysis requests
- Clear error surfacing if a prompt file is missing

**Alternative:** Load on-demand per request → slight latency hit, not worth the complexity

### 4. Data Model: Add `analyst_persona` Column
**Decision**: Add `analyst_persona: TEXT` column to `analyses` table (nullable to handle legacy entries)

**Rationale:**
- Enables history to show which persona was used when viewing an entry
- Allows future analytics on persona preferences
- Nullable column for backwards compatibility

**Migration:** Create Supabase migration to add column with default NULL

### 5. History Display: Persona Visible Only When Viewing Entry
**Decision**: Show persona name in the analysis view when user opens a historical entry. Don't display in sidebar.

**Rationale:**
- Sidebar stays clean and uncluttered (most users use one persona, so redundant info)
- Persona is discoverable where it matters (when reviewing the analysis)
- Minimal UI addition, no sidebar clutter
- Users can easily see which voice analyzed a specific entry

**Alternative:** Show persona badge in sidebar → clutters sidebar with redundant info for most users

### 6. Default Persona: Jungian Analyst
**Decision**: Set Jungian as the default selected persona on first load

**Rationale:**
- Matches current behavior (existing prompt is Jungian)
- Makes onboarding frictionless—users don't need to pick
- Gives existing behavior a name
- Users can switch anytime if they prefer a different voice

### 7. AnalystPicker Component: Reuse Existing Picker Pattern
**Decision**: Create `components/AnalystPicker` (sister component to ModelPicker) with same button + dropdown UI

**Rationale:**
- Consistent UX
- Already proven pattern
- Minimal new component code
- No need to disable during analysis (picker state doesn't affect in-flight requests)

### 8. Server Action: Pass `selectedPersona` Through Analysis Flow
**Decision**: Update `analyzeText(journalText, modelId, selectedPersona)` signature

**Rationale:**
- Flows naturally through the existing two-phase pipeline
- Persona + model are orthogonal choices
- Store persona in the saved analysis for history

## Risks / Trade-offs

**Risk 1: Persona Prompt Quality Variance**
→ Mitigation: Test each persona prompt thoroughly before shipping. Validate that all three produce well-structured outputs with proper `---IMAGE PROMPT---` delimiters.

**Risk 2: Users Confused by Multiple Personas**
→ Mitigation: Keep picker subtle (header-level, default Jungian). Ensures seamless experience for users who don't care, easy discovery for those who do.

**Risk 3: Backwards Compatibility with Existing Analyses**
→ Mitigation: `analyst_persona` is nullable; existing entries show no persona. When viewing historical entry without persona, default to Jungian context or show no label.

**Risk 4: Image Prompt Variation Causes Visual Inconsistency**
→ Mitigation: Each persona's image prompt guidance is carefully tuned to produce visually coherent (if stylistically distinct) outputs. Test with real Midjourney before shipping.

## Migration Plan

1. Create `prompts/` directory with three .md files (Jungian, Mel Robbins, Loving Parent)
2. Update `lib/gemini.ts` to load all three prompts at startup, cache in memory
3. Add `loadPersonaPrompts()` function alongside `getSystemPrompt()`
4. Create Supabase migration to add `analyst_persona: TEXT` column (nullable)
5. Update `analyzeText()` server action to accept `selectedPersona` parameter with default "jungian"
6. Create `AnalystPicker` component and integrate into header
7. Update analysis view to display persona name when viewing a historical entry
8. Update `getAnalysisById()` to fetch and return persona info
9. Test all three personas end-to-end with mock and real Gemini/Midjourney

**Rollback:** If needed, hide AnalystPicker component and default all analyses to Jungian persona. No data loss.

## Open Questions

None at this time—design is locked in based on user decisions above.

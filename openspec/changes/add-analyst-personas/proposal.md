## Why

Users have diverse analytical preferences. The current Jungian analyst prompt is powerful but represents a single voice. By introducing multiple analyst personas, we unlock the tool for users who prefer different thinking styles—whether that's action-oriented coaching (Mel Robbins), compassionate empathy (Loving Parent), or psychological depth (Jungian). This increases engagement and makes the tool feel more personalized.

## What Changes

- **Analyst Persona Picker**: New dropdown in the header (alongside ModelPicker) to select from three analyst voices.
- **Three Analyst Personas**: Jungian (current), Mel Robbins (action-focused), Loving Parent (empathetic). Each has custom section names, tone, and guidance.
- **Persona-Specific Prompts**: Each persona generates a unique system prompt with custom section names and image guidance.
- **Unique Image Prompts**: Each analyst voice generates different imagery aligned with its perspective (mystical vs. bold vs. nurturing).
- **History Labeling**: Analysis history entries display which analyst persona was used.
- **Data Model Update**: Store `analyst_persona` field in the `analyses` table.

## Capabilities

### New Capabilities
- `analyst-persona-selection`: Ability to pick and persist an analyst persona for each analysis session. Includes UI picker and state management.
- `analyst-personas`: The three distinct analyst persona definitions (Jungian, Mel Robbins, Loving Parent), with custom section names, tones, and image generation logic.

### Modified Capabilities
- `journal-analysis`: Requirement changes—analysis output now varies by selected analyst persona. System prompt and output structure are persona-dependent instead of fixed.
- `model-picker`: Will share UI space with new analyst-persona picker in the header.

## Impact

- **Frontend**: New picker component in header; UI state management for persona selection; history sidebar labels updated.
- **Backend**: Persona selection passed through to Gemini (different system prompts); persona stored in Supabase `analyses` table.
- **Prompts Directory**: Three separate prompt files in a new `prompts/` directory (one per persona).
- **Data Model**: `analyses` table needs `analyst_persona` column.
- **Image Generation**: Midjourney prompts now persona-specific.

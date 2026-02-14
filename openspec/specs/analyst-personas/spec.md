## Purpose

Define three distinct analyst personas (Jungian Analyst, Mel Robbins, Loving Parent), each with custom section names, tones, and image generation guidance.

## ADDED Requirements

### Requirement: Define Jungian Analyst persona

The system SHALL provide a Jungian analyst persona with custom section names, tone, and image guidance. The persona combines psychoanalytic depth with mystical insight.

#### Scenario: Jungian analysis output
- **WHEN** user selects "Jungian Analyst" and submits journal text
- **THEN** system generates analysis with three custom sections: "Reflective Analysis", "Left-Field Insight", "Follow-Up Prompt"
- **AND** image prompt incorporates alchemical and sacred geometry symbolism

### Requirement: Define Mel Robbins persona

The system SHALL provide a Mel Robbins persona with action-oriented section names, tone, and image guidance. The persona focuses on practical breakthrough and bold moves.

#### Scenario: Mel Robbins analysis output
- **WHEN** user selects "Mel Robbins" and submits journal text
- **THEN** system generates analysis with three custom sections specific to this persona (e.g., "What You're Actually Doing", "The Real Move", "Your Action")
- **AND** image prompt incorporates bold, action-oriented visual metaphors

### Requirement: Define Loving Parent persona

The system SHALL provide a Loving Parent persona with compassionate section names, tone, and image guidance. The persona emphasizes empathy and nurturing support.

#### Scenario: Loving Parent analysis output
- **WHEN** user selects "Loving Parent" and submits journal text
- **THEN** system generates analysis with three custom sections specific to this persona (e.g., "What I'm Hearing", "What My Heart Knows", "What I Want For You")
- **AND** image prompt incorporates warm, nurturing visual elements

### Requirement: Load and cache persona prompts

The system SHALL load all three persona prompt files at server startup and cache them in memory.

#### Scenario: Prompts loaded successfully
- **WHEN** server starts
- **THEN** system loads `prompts/jungian.md`, `prompts/mel-robbins.md`, and `prompts/loving-parent.md`
- **AND** prompts are cached for fast access

#### Scenario: Missing prompt file
- **WHEN** a persona prompt file is missing or unreadable
- **THEN** system logs an error and gracefully prevents that persona from being selected

### Requirement: Each persona generates unique image prompts

The system SHALL ensure each analyst persona generates a distinct image prompt aligned with its voice and perspective.

#### Scenario: Different image prompts per persona
- **WHEN** the same journal text is analyzed by different personas
- **THEN** each persona generates a visually distinct image prompt appropriate to its analytical style
- **AND** all three image prompts pass validation (contain required prompt structure for Midjourney)

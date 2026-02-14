## ADDED Requirements

### Requirement: Display analyst persona selection options

The system SHALL display an analyst persona picker with three options in the header, each with a display name and description.

| Display Name | Persona ID | Description |
|-------------|----------|-------------|
| Jungian Analyst | `jungian` | Psychoanalytic depth – symbolic insights, spiritual perspective |
| Mel Robbins | `mel-robbins` | Action-oriented – bold moves, practical breakthrough |
| Loving Parent | `loving-parent` | Compassionate – empathetic support, nurturing perspective |

#### Scenario: User views persona options
- **WHEN** user opens the analyst persona picker dropdown
- **THEN** system displays all three persona options with their display names and descriptions

### Requirement: Default persona selection

The system SHALL use `jungian` as the default analyst persona when no selection has been made.

#### Scenario: First-time user sees default
- **WHEN** user loads the app with no saved persona preference
- **THEN** system displays "Jungian Analyst" as the selected persona

### Requirement: Persist persona selection

The system SHALL save the user's persona selection to component state and pass it through the analysis flow.

#### Scenario: User changes persona selection
- **WHEN** user selects a different persona from the picker
- **THEN** system updates the selected persona in component state

#### Scenario: User analyzes with selected persona
- **WHEN** user submits journal text for analysis
- **THEN** system passes the currently selected persona to the `analyzeText` server action

### Requirement: Store persona in analysis history

The system SHALL store the analyst persona used for each analysis in the `analyses` table.

#### Scenario: New analysis saved with persona
- **WHEN** user completes an analysis
- **THEN** system saves the `analyst_persona` field to the Supabase `analyses` table with the persona ID used

#### Scenario: Retrieved analysis shows persona context
- **WHEN** user views a historical analysis
- **THEN** system retrieves and displays which analyst persona was used for that analysis

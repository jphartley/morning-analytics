## Purpose

Enable users to select their preferred analytical voice (persona) for journal analysis.
## Requirements
### Requirement: Display analyst persona selection options

The system SHALL display an analyst persona picker in all view-density modes with three options in the header, each with a display name and description.

| Display Name | Persona ID | Description |
|-------------|----------|-------------|
| Jungian Analyst | `jungian` | Psychoanalytic depth – symbolic insights, spiritual perspective |
| Mel Robbins | `mel-robbins` | Action-oriented – bold moves, practical breakthrough |
| Loving Parent | `loving-parent` | Compassionate – empathetic support, nurturing perspective |

#### Scenario: User views persona options
- **WHEN** user opens the analyst persona picker dropdown
- **THEN** system displays all three persona options with their display names and descriptions

#### Scenario: User is in quiet mode
- **WHEN** user views the page header while in `quiet` mode
- **THEN** system displays the analyst persona picker

### Requirement: Default persona selection

The system SHALL use `jungian` as the default analyst persona when no selection has been made.

#### Scenario: First-time user sees default
- **WHEN** user loads the app with no saved persona preference
- **THEN** system displays "Jungian Analyst" as the selected persona

### Requirement: Persist persona selection

The system SHALL save the user's selected analyst persona to browser localStorage and use that value as the visible and submitted persona for the current session.

#### Scenario: User changes persona selection
- **WHEN** user selects a different persona from the picker
- **THEN** system updates the selected persona in page state
- **AND** system saves the persona ID to localStorage
- **AND** the picker displays the same persona that page state will submit

#### Scenario: User returns to app
- **WHEN** user loads the app with a previously saved, currently supported persona
- **THEN** system displays the saved persona as selected

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

### Requirement: Gracefully fall back from unavailable persona storage

The system SHALL use `jungian` without error when browser localStorage is unavailable, has no saved persona, or contains a persona ID that is not currently supported.

#### Scenario: localStorage is unavailable
- **WHEN** browser localStorage cannot be read or written
- **THEN** system uses `jungian` as the analyst persona
- **AND** persona changes continue working for the current session
- **AND** system does not throw an error or crash

#### Scenario: Saved persona is no longer supported
- **WHEN** localStorage contains a persona ID that is not one of the current picker options
- **THEN** system uses `jungian` as the analyst persona
- **AND** system does not throw an error or crash


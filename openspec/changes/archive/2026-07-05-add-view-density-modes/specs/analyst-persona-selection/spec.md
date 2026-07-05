## MODIFIED Requirements

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

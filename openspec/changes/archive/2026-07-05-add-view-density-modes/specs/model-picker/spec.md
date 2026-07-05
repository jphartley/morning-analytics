## MODIFIED Requirements

### Requirement: Display model selection options

The system SHALL display a model picker with three options in insight and test modes, each showing a display name and trade-off description. The system SHALL hide the model picker in quiet mode while preserving the selected model value for analysis.

| Display Name | Model ID | Description |
|-------------|----------|-------------|
| Gemini 3.1 Flash-Lite | `gemini-3.1-flash-lite` | Fastest answers |
| Gemini 3.5 Flash | `gemini-3.5-flash` | All-around help |
| Gemini 3.1 Pro | `gemini-3.1-pro-preview` | Advanced analysis and reasoning |

#### Scenario: User views model options in insight or test mode
- **WHEN** user opens the model picker dropdown while in `insight` or `test` mode
- **THEN** system displays all three current Gemini model options with their display names and descriptions
- **AND** model picker is positioned alongside the analyst persona picker and view-density control in the header

#### Scenario: User is in quiet mode
- **WHEN** user views the page header while in `quiet` mode
- **THEN** system hides the model picker
- **AND** system preserves the currently selected model for future analysis

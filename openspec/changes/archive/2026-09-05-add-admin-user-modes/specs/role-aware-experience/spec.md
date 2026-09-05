## Purpose

Define the normal-user and administrator experiences so journaling remains calm for friends while the existing experimentation workflow remains available to administrators.

## ADDED Requirements

### Requirement: Provide a simple normal-user experience
The system SHALL show normal users only Quiet and Insights views, analyst selection, palette selection, journal analysis, image generation, history, regeneration, and deletion of their own analyses.

#### Scenario: Normal user opens the app
- **WHEN** a user-role account loads the main application
- **THEN** it SHALL not render Test/Debug, model selection, image-provider selection, memory experiments, mock state, or diagnostic controls

#### Scenario: Normal user changes personal presentation preferences
- **WHEN** a user-role account selects an analyst, view, or palette
- **THEN** the selected control SHALL affect that account's browser presentation without exposing internal generation controls

### Requirement: Preserve the administrator experimentation experience
The system SHALL make Quiet, Insights, and Test/Debug views available to administrators.

#### Scenario: Administrator selects Insights
- **WHEN** an administrator selects Insights
- **THEN** the application SHALL show analyst and model selection with human-facing insight metadata

#### Scenario: Administrator selects Test/Debug
- **WHEN** an administrator selects Test/Debug
- **THEN** the application SHALL show the existing provider, mock, memory-experiment, diagnostic, reset, and rebuild controls

### Requirement: Apply normal-user product defaults
The system SHALL initially use Inkwell, Quiet, Jungian Analyst, Gemini 3.1 Pro Preview, Midjourney/Discord, and disabled contextual memory for a normal-user account with no applicable saved preference.

#### Scenario: New normal user starts an analysis
- **WHEN** a user-role account opens the application with no saved view, analyst, or palette preference
- **THEN** the page SHALL use Quiet, Jungian Analyst, and Inkwell
- **AND** analysis SHALL use Gemini 3.1 Pro Preview, Midjourney/Discord, and no contextual memory

#### Scenario: Existing unsupported preference is restored
- **WHEN** a user-role account has a stored Test view, model, or provider selection from an earlier application version
- **THEN** the application SHALL ignore that unsupported selection and use the applicable normal-user default without error

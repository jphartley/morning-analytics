## ADDED Requirements

### Requirement: Restrict detailed diagnostics to administrator Test/Debug
The system SHALL render detailed image-generation diagnostics and copy affordances only to administrators in enabled Test/Debug.

#### Scenario: Normal-user image generation completes or fails
- **WHEN** a user-role account receives an image-generation result
- **THEN** the UI SHALL show the successful images or a user-safe warning or failure summary
- **AND** it SHALL not render provider attempts, telemetry, timelines, or diagnostic copy controls

#### Scenario: Administrator inspects Test/Debug output
- **WHEN** an administrator views image-generation output in Test/Debug
- **THEN** the existing redacted diagnostics disclosure SHALL remain available

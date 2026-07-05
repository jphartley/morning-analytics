## ADDED Requirements

### Requirement: Limit diagnostic display to test mode
The system SHALL display image-generation diagnostic affordances and detailed diagnostic traces only in test mode.

#### Scenario: Diagnostics available in test mode
- **WHEN** image generation is pending, succeeds, warns, or fails in `test` mode
- **THEN** the system SHALL make the image-generation diagnostics disclosure available when diagnostic context exists
- **AND** the disclosure SHALL include provider, attempt, timing, timeline, redacted metadata, and diagnostic copy affordances according to existing diagnostic behavior

#### Scenario: Diagnostics hidden outside test mode
- **WHEN** image generation is pending, succeeds, warns, or fails in `quiet` or `insight` mode
- **THEN** the system SHALL NOT render the diagnostic disclosure or diagnostic copy affordance
- **AND** the system SHALL still show any user-facing failure or warning summary

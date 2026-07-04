## ADDED Requirements

### Requirement: Recover missed Discord completion messages

The system SHALL attempt a bounded recent-message lookup in the configured Discord channel when the live gateway listener does not observe a completed Midjourney grid.

#### Scenario: Gateway event is missed
- **WHEN** Midjourney has posted a completed image grid in the configured channel after the generation attempt started
- **AND** the live gateway listener does not capture the completion event
- **THEN** the system SHALL inspect a bounded set of recent channel messages for a matching completed Midjourney grid
- **THEN** the system SHALL use the recovered grid image when a matching candidate is found

#### Scenario: Recovery finds no matching message
- **WHEN** neither the live gateway listener nor the bounded recent-message lookup finds a completed Midjourney grid
- **THEN** the system SHALL return an image generation failure with diagnostics that identify the listener/recovery stage

### Requirement: Correlate Midjourney completions conservatively

The system SHALL avoid accepting unrelated Midjourney image messages as the result for the current generation attempt.

#### Scenario: Candidate messages are filtered
- **WHEN** inspecting live or recently fetched Discord messages
- **THEN** the system SHALL only consider messages from the Midjourney bot in the configured channel
- **THEN** the system SHALL prefer messages created after the generation attempt start time
- **THEN** the system SHALL require a completed-grid shape with at least one image attachment or embed

#### Scenario: Prompt context is available
- **WHEN** prompt context can be compared safely
- **THEN** the system SHALL use a redacted prompt snippet or hash to prefer the candidate associated with the current attempt

### Requirement: Report Discord handoff failures clearly

The system SHALL return actionable image-generation errors when Discord trigger, listener, recovery, fetch, split, or upload stages fail.

#### Scenario: Channel handoff fails
- **WHEN** the prompt trigger succeeds but no usable Midjourney grid is captured from the configured channel
- **THEN** the system SHALL return an error that distinguishes capture failure from trigger failure
- **THEN** the diagnostics SHALL include redacted configured channel context and latest inspected candidate counts when available


# image-generation-diagnostics Specification

## Purpose
Describe how image generation attempts expose safe, redacted diagnostics that make Midjourney/Discord handoff behavior understandable during local debugging.
## Requirements
### Requirement: Capture image generation attempt diagnostics

The system SHALL collect a chronological diagnostic trace for each image generation attempt in both new-analysis and regeneration flows.

#### Scenario: Attempt records major stages
- **WHEN** image generation starts
- **THEN** the system SHALL record diagnostic events for trigger, listener setup, Discord message observation or recovery, image fetch, image split, upload, and final result

#### Scenario: Attempt records failure stage
- **WHEN** image generation fails
- **THEN** the diagnostic trace SHALL identify the stage where the failure occurred
- **THEN** the diagnostic trace SHALL include a short human-readable failure message

### Requirement: Redact sensitive diagnostic data

The system SHALL redact sensitive Discord, prompt, and asset data before returning diagnostics to the browser.

#### Scenario: Tokens are never exposed
- **WHEN** diagnostics are returned to the client
- **THEN** Discord user tokens, Discord bot tokens, Supabase service role keys, and API keys SHALL NOT be present

#### Scenario: Discord and prompt details are minimized
- **WHEN** diagnostics include Discord or prompt context
- **THEN** full Discord channel IDs, full guild IDs, full prompts, and signed Discord CDN URLs SHALL NOT be displayed
- **THEN** the system MAY display redacted suffixes, counts, lengths, hashes, or short snippets

### Requirement: Return diagnostics with image generation responses

The system SHALL include redacted attempt diagnostics in image generation and image regeneration responses.

#### Scenario: Successful response includes diagnostics
- **WHEN** image generation succeeds
- **THEN** the response SHALL include diagnostics indicating the successful path through trigger, capture, fetch, split, and upload

#### Scenario: Failed response includes diagnostics
- **WHEN** image generation fails after an attempt begins
- **THEN** the response SHALL include diagnostics collected before the failure

#### Scenario: Diagnostics can be copied for debugging
- **WHEN** diagnostics are displayed in the app
- **THEN** the user SHALL be able to copy a paste-ready diagnostic report
- **THEN** the copied report SHALL include attempt metadata, final status, event meanings, raw event messages, and redacted event details
- **THEN** the copied report SHALL NOT include secrets, full Discord IDs, full prompts, signed Discord CDN URLs, or Supabase secrets

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


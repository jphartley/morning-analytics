## ADDED Requirements

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


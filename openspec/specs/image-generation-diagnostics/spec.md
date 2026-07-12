# image-generation-diagnostics Specification

## Purpose
Describe how image generation attempts expose safe, provider-aware diagnostics for local debugging.
## Requirements
### Requirement: Capture image generation attempt diagnostics

The system SHALL collect a chronological, provider-aware diagnostic trace for each image generation attempt in both new-analysis and regeneration flows.

#### Scenario: Attempt records common stages
- **WHEN** image generation starts
- **THEN** the system SHALL record diagnostic events for provider selection, provider submission, provider waiting or observation, provider result retrieval, image normalization or transformation, upload, and final result

#### Scenario: Attempt records provider-specific stages
- **WHEN** a provider performs provider-specific work such as Discord recovery, grid splitting, polling, or signed-result download
- **THEN** the diagnostic trace SHALL include redacted events for those provider-specific stages

#### Scenario: Attempt records failure stage
- **WHEN** image generation fails
- **THEN** the diagnostic trace SHALL identify the provider and stage where the failure occurred
- **THEN** the diagnostic trace SHALL include a short human-readable failure message

### Requirement: Redact sensitive diagnostic data

The system SHALL redact sensitive provider, prompt, asset, and storage data before returning diagnostics to the browser.

#### Scenario: Secrets are never exposed
- **WHEN** diagnostics are returned to the client
- **THEN** Discord user tokens, Discord bot tokens, Black Forest Labs API keys, Supabase service role keys, webhook secrets, and other provider credentials SHALL NOT be present

#### Scenario: Provider and prompt details are minimized
- **WHEN** diagnostics include provider, Discord, Black Forest Labs, or prompt context
- **THEN** full Discord channel IDs, full guild IDs, full prompts, signed CDN URLs, Black Forest Labs polling URLs, and Black Forest Labs delivery URLs SHALL NOT be displayed
- **THEN** the system MAY display provider names, model names, redacted request-ID suffixes, counts, lengths, hashes, short snippets, elapsed time, slot status, or provider-reported cost

#### Scenario: Unknown signed or credential-bearing URL is encountered
- **WHEN** diagnostic metadata contains a URL with query parameters, signatures, tokens, or provider result access information
- **THEN** the system SHALL redact the complete URL rather than returning a truncated prefix

### Requirement: Distinguish attempt identity from analysis identity
The system SHALL use a fresh diagnostic attempt ID for every initial-generation or regeneration invocation independently of the permanent analysis ID used for persistence.

#### Scenario: Initial generation starts
- **WHEN** initial image generation starts for a new analysis
- **THEN** diagnostics and the selected provider SHALL receive the same fresh attempt ID
- **AND** storage and analysis persistence SHALL continue using the permanent analysis ID

#### Scenario: Regeneration starts
- **WHEN** image regeneration starts for an existing analysis
- **THEN** diagnostics and the selected provider SHALL receive the same fresh attempt ID for that round
- **AND** the diagnostic attempt ID SHALL differ from the permanent analysis ID
- **AND** the permanent analysis ID SHALL continue identifying the database record and storage directory

### Requirement: Return diagnostics with image generation responses

The system SHALL include redacted attempt diagnostics in image generation and image regeneration responses.

#### Scenario: Successful response includes diagnostics
- **WHEN** image generation succeeds
- **THEN** the response SHALL include diagnostics identifying the selected provider and the successful provider, retrieval, normalization, and upload stages

#### Scenario: Failed response includes diagnostics
- **WHEN** image generation fails after an attempt begins
- **THEN** the response SHALL include diagnostics collected before the failure

#### Scenario: Diagnostics can be copied for debugging
- **WHEN** diagnostics are displayed in the app
- **THEN** the user SHALL be able to copy a paste-ready diagnostic report
- **THEN** the copied report SHALL include attempt metadata, provider, final status, event meanings, raw event messages, and redacted event details
- **THEN** the copied report SHALL NOT include secrets, full provider identifiers where sensitive, full prompts, signed provider URLs, or Supabase secrets

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

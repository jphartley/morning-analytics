## MODIFIED Requirements

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

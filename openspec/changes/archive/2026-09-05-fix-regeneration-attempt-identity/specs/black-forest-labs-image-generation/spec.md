## MODIFIED Requirements

### Requirement: Submit a four-image FLUX generation set
The Black Forest Labs provider SHALL submit four text-to-image requests using the selected FLUX model and the image prompt supplied by the application.

#### Scenario: Generation set is submitted
- **WHEN** Black Forest Labs is selected for a valid image prompt
- **THEN** the provider SHALL submit four generation requests through the configured Black Forest Labs API endpoint
- **AND** each request SHALL use a distinct recorded seed or equivalent variation input
- **AND** each request SHALL request an application-compatible square image and supported output format

#### Scenario: Separate attempts use separate variation inputs
- **WHEN** Black Forest Labs generates more than one attempt for the same analysis and prompt
- **THEN** every attempt SHALL receive a distinct attempt ID from shared orchestration
- **AND** each slot seed SHALL be derived from that distinct attempt ID so separate attempts do not intentionally reuse the same four-seed set

#### Scenario: Submission succeeds
- **WHEN** Black Forest Labs accepts a generation request
- **THEN** the provider SHALL retain the returned provider request ID and polling URL for that image slot
- **AND** the provider SHALL record only redacted request metadata in diagnostics

# black-forest-labs-image-generation Specification

## Purpose
Define direct Black Forest Labs FLUX generation, polling, result validation, download, and error behavior.

## Requirements
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

### Requirement: Follow provider-returned polling URLs
The Black Forest Labs provider SHALL poll the URL returned for each accepted request until that request reaches a supported terminal state or the provider timeout expires.

#### Scenario: Request is pending
- **WHEN** a polling response reports a non-terminal pending state
- **THEN** the provider SHALL continue polling at a bounded interval
- **AND** the provider SHALL respect the attempt timeout and cancellation signal

#### Scenario: Request is ready
- **WHEN** a polling response reports `Ready` with a result URL
- **THEN** the provider SHALL stop polling that image slot
- **AND** the provider SHALL begin server-side result download

#### Scenario: Request is moderated
- **WHEN** a polling response reports request or content moderation
- **THEN** the provider SHALL treat the image slot as a non-retryable moderated failure
- **AND** diagnostics SHALL identify moderation without including the full prompt

#### Scenario: Request fails
- **WHEN** a polling response reports a terminal provider error or an unsupported terminal state
- **THEN** the provider SHALL fail that image slot with normalized provider diagnostics

### Requirement: Validate Black Forest Labs result URLs
The Black Forest Labs provider SHALL validate provider-returned polling and delivery URLs before issuing server-side requests.

#### Scenario: HTTPS Black Forest Labs URL is returned
- **WHEN** a returned URL uses HTTPS and belongs to an allowed Black Forest Labs API or delivery host
- **THEN** the provider SHALL permit the polling or download request

#### Scenario: Unexpected URL is returned
- **WHEN** a returned polling or delivery URL uses an unsupported protocol or host
- **THEN** the provider SHALL reject the URL as an invalid provider response
- **AND** the system SHALL NOT issue a request to that URL

### Requirement: Download completed images before URL expiry
The Black Forest Labs provider SHALL download completed image results on the server before returning the generated image set.

#### Scenario: Signed result is available
- **WHEN** an image slot becomes ready with a valid delivery URL
- **THEN** the provider SHALL download the image immediately
- **AND** the provider SHALL verify a supported image content type and non-empty response body
- **AND** the provider SHALL return normalized image data to shared storage orchestration

#### Scenario: Result download fails
- **WHEN** a signed result URL expires, returns an error, or does not contain a supported image
- **THEN** the provider SHALL fail the image slot with a download-stage error
- **AND** the signed result URL SHALL NOT be returned to the browser

### Requirement: Preserve the four-image application contract
The Black Forest Labs provider SHALL return a successful generation set only when all four image slots complete and download successfully.

#### Scenario: All image slots succeed
- **WHEN** all four Black Forest Labs requests complete and download successfully
- **THEN** the provider SHALL return exactly four normalized images in deterministic slot order

#### Scenario: One or more image slots fail after bounded retries
- **WHEN** fewer than four image slots complete successfully
- **THEN** the provider SHALL return a failed generation set
- **AND** diagnostics SHALL report successful, failed, moderated, timed-out, and retried slot counts
- **AND** the shared upload stage SHALL NOT persist an incomplete initial set

### Requirement: Handle Black Forest Labs API errors explicitly
The Black Forest Labs provider SHALL classify authentication, credit, rate-limit, moderation, timeout, transport, and invalid-response errors into actionable image-generation failures.

#### Scenario: API key is rejected
- **WHEN** Black Forest Labs returns an authentication or authorization error
- **THEN** the system SHALL report that Black Forest Labs credentials require attention
- **AND** the system SHALL NOT include the API key in logs or diagnostics

#### Scenario: Credits are insufficient
- **WHEN** Black Forest Labs returns an insufficient-credit response
- **THEN** the system SHALL fail without retrying the request
- **AND** the user-facing error SHALL indicate that provider credits require attention

#### Scenario: Provider rate limit is reached
- **WHEN** Black Forest Labs returns a rate-limit response
- **THEN** the provider SHALL perform bounded retries using provider guidance or exponential backoff
- **AND** the provider SHALL fail with a rate-limit error if retry capacity is exhausted

#### Scenario: Provider timeout expires
- **WHEN** the generation set does not complete before the configured provider timeout
- **THEN** the provider SHALL stop polling
- **AND** the system SHALL return a Black Forest Labs timeout error with redacted slot progress

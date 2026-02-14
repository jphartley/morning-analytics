## ADDED Requirements

### Requirement: Save analysis record
The system SHALL persist a complete analysis record after images are generated. The record SHALL include: input text, analysis text, image prompt, model identifier, timestamp, and references to stored images.

#### Scenario: Successful save after analysis
- **WHEN** image generation completes successfully
- **THEN** system saves the analysis record to Supabase Postgres
- **AND** all 4 images are uploaded to Supabase Storage
- **AND** the record includes paths to the stored images

#### Scenario: Save with image upload failure
- **WHEN** image upload to storage fails
- **THEN** system retries the upload once
- **AND** if retry fails, saves the record without image paths
- **AND** displays an error notification to the user

### Requirement: Store images in blob storage
The system SHALL upload analysis images to Supabase Storage bucket `analysis-images`. Images SHALL be stored at path `{analysis_id}/{index}.{ext}` where index is 0-3 and `{ext}` is `jpg` or `png`.

#### Scenario: Upload images to storage
- **WHEN** saving an analysis with 4 images
- **THEN** system uploads each image as a JPEG or PNG blob
- **AND** stores paths as `{analysis_id}/0.jpg` through `{analysis_id}/3.jpg`

#### Scenario: Upload PNG images
- **WHEN** saving an analysis with PNG images
- **THEN** system uploads each image with content type `image/png`
- **AND** stores paths as `{analysis_id}/0.png` through `{analysis_id}/3.png`

#### Scenario: Image format conversion
- **WHEN** images are provided as base64 data URLs
- **THEN** system preserves the original format when possible (JPEG or PNG)
- **AND** stores images as JPEG or PNG blobs before upload

### Requirement: Retrieve analysis by ID
The system SHALL retrieve a complete analysis record by its UUID, including public URLs for all associated images.

#### Scenario: Fetch existing analysis
- **WHEN** user requests analysis with valid UUID
- **THEN** system returns the full record from Postgres
- **AND** generates public URLs for each image in storage

#### Scenario: Fetch non-existent analysis
- **WHEN** user requests analysis with unknown UUID
- **THEN** system returns null or appropriate error

### Requirement: List analyses chronologically
The system SHALL retrieve a list of analyses sorted by creation timestamp in descending order (newest first).

#### Scenario: Fetch recent analyses
- **WHEN** history sidebar loads
- **THEN** system returns analyses ordered by created_at DESC
- **AND** includes id, created_at, and first 100 characters of input_text for each

#### Scenario: Empty history
- **WHEN** no analyses exist
- **THEN** system returns an empty list

### Requirement: Database schema
The system SHALL use a Postgres table `analyses` with columns: id (UUID, primary key), created_at (timestamptz), input_text (text), analysis_text (text), image_prompt (text), model_id (text), image_paths (text array).

#### Scenario: Schema supports required fields
- **WHEN** saving an analysis
- **THEN** all required fields (input_text, analysis_text, model_id) are stored
- **AND** optional fields (image_prompt, image_paths) may be null

### Requirement: Environment configuration
The system SHALL require Supabase configuration via environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for client access, SUPABASE_SERVICE_ROLE_KEY for server-side writes.

#### Scenario: Missing configuration
- **WHEN** required environment variables are not set
- **THEN** system throws a clear error at startup indicating which variables are missing

### Requirement: Mock image provider for development
The system SHALL support a mock image provider for local development to avoid long image generation waits. The provider SHALL be controlled by `NEXT_PUBLIC_IMAGE_PROVIDER` (default `midjourney`, optional `mock`).

#### Scenario: Mock provider enabled
- **WHEN** `NEXT_PUBLIC_IMAGE_PROVIDER=mock`
- **THEN** system returns 4 static images within ~1 second
- **AND** images are sourced from `public/mock-images` (jpg or png)

#### Scenario: Mock images follow normal storage flow
- **WHEN** mock images are generated
- **THEN** system uploads them through the normal Supabase storage pipeline
- **AND** returns storage paths for the saved analysis

## ADDED Requirements

### Requirement: Update image paths for existing analysis

The system SHALL support appending new image paths to an existing analysis record's `image_paths` JSONB array.

#### Scenario: Append paths after regeneration

- **WHEN** regeneration produces new image paths
- **THEN** system appends new paths to the existing `image_paths` array via UPDATE
- **THEN** the updated array contains both previous and new paths in index order

#### Scenario: First images added to analysis with no prior images

- **WHEN** analysis previously had null `image_paths` (initial generation failed)
- **THEN** system sets `image_paths` to the new paths array

## MODIFIED Requirements

### Requirement: Image paths reference user's analyses

The system SHALL store image paths in the `image_paths` JSONB column, organized by analysis ID. Image indices SHALL be globally unique within an analysis to support multiple generation rounds.

#### Scenario: Image paths stored per analysis

- **WHEN** images are uploaded for an analysis
- **THEN** `image_paths` contains array of paths: `["analysisId/0.jpg", "analysisId/1.jpg", ...]` associated with authenticated user's analysis

#### Scenario: Image paths grow across regeneration rounds

- **WHEN** images are regenerated for an analysis that already has N images
- **THEN** new images are stored at indices N through N+3
- **THEN** `image_paths` array contains all paths from all rounds

#### Scenario: Image URLs respect user isolation

- **WHEN** client fetches image URLs from `image_paths`
- **THEN** images can only be retrieved if user owns the analysis (via RLS on analyses table)

## Why

Users cannot review past morning page analyses to track patterns and insights over time. Each analysis is ephemeral - displayed once and lost when the page refreshes. Additionally, AI-generated images are served from Discord CDN URLs that may expire, making historical review impossible even if users saved the page.

## What Changes

- Add Supabase integration for persistent storage (Postgres for metadata, Storage for images)
- Automatically save each analysis after completion (input text, analysis text, images, model, timestamp)
- Add a history browser UI for viewing past analyses chronologically
- Download and store images locally rather than relying on Discord CDN URLs

## Capabilities

### New Capabilities

- `analytics-storage`: Supabase integration for persisting analyses. Handles database schema, image storage, and CRUD operations for analysis records. Includes data model for storing input text, analysis output, images (as blobs), model identifier, and timestamps.

- `history-browser`: User interface for browsing past analyses. Displays a chronological flat list of previous entries with date, preview snippet, and thumbnail. Clicking an entry shows the full analysis with all images.

### Modified Capabilities

None. The persistence layer will be called from the existing analysis flow, but the `journal-analysis` spec requirements remain unchanged - it still analyzes text and returns results. The save operation is additive, not a modification to existing behavior.

## Impact

- **New dependency**: Supabase JS client library
- **Environment variables**: Supabase project URL and anon key
- **Database**: New `analyses` table in Supabase Postgres
- **Storage**: New bucket in Supabase Storage for images
- **UI**: New history view accessible from main interface
- **Data flow**: Post-analysis hook to persist results before/after display

## Purpose

Admin-only CLI tool for managing Supabase storage by deleting old test data. Enables recency-based retention policies (e.g., keep only the 5 most recent analyses) while cascade-deleting associated S3 images. Designed as a secure, local-only solution that can transition to an authenticated API endpoint when user authentication is implemented.

## Requirements

### Requirement: CLI command accepts retention parameter
The system SHALL provide a command-line interface that accepts a `--keep` parameter specifying how many of the most recent history items to retain.

#### Scenario: User specifies retention count
- **WHEN** user runs the cleanup script with `--keep 5`
- **THEN** the script accepts the parameter and proceeds with that retention value

#### Scenario: User omits parameter
- **WHEN** user runs the cleanup script without `--keep`
- **THEN** the script displays an error message indicating the parameter is required and exits without making changes

### Requirement: Determine items to delete based on recency
The system SHALL identify all history items beyond the N most recent (by creation date), marking them for deletion.

#### Scenario: Query history with multiple items
- **WHEN** the database contains 50 history items with various creation dates
- **THEN** the system correctly identifies the 5 most recent items and marks all others (45 items) for deletion

#### Scenario: Retention value exceeds total items
- **WHEN** the user requests `--keep 100` but only 50 items exist
- **THEN** the system reports that no items will be deleted (50 items retained, 0 marked for deletion)

### Requirement: Display deletion preview and require confirmation
The system SHALL display a summary of what will be deleted and prompt the user to confirm by typing "yes".

#### Scenario: Preview before deletion
- **WHEN** deletion candidates have been identified (e.g., 47 items, 188 images)
- **THEN** the system prints "About to delete 47 items and 188 images. Type 'yes' to confirm:" and waits for input

#### Scenario: User confirms deletion
- **WHEN** the preview is displayed and user types "yes"
- **THEN** the system proceeds with deletion

#### Scenario: User declines deletion
- **WHEN** the preview is displayed and user types anything other than "yes"
- **THEN** the system aborts without making any changes and exits gracefully

### Requirement: Delete history items from Supabase
The system SHALL delete all marked history items from the `analysis_history` table in Supabase.

#### Scenario: Delete marked items
- **WHEN** deletion is confirmed and 47 items are marked for deletion
- **THEN** the system removes all 47 records from the `analysis_history` table

#### Scenario: Verify deletion in database
- **WHEN** items have been deleted
- **THEN** subsequent query of the database confirms those items no longer exist

### Requirement: Cascade-delete associated S3 images
The system SHALL delete all S3 images associated with deleted history items from Supabase storage.

#### Scenario: Delete images for each item
- **WHEN** a history item is deleted and it references 4 S3 images
- **THEN** all 4 images are deleted from Supabase-managed S3 storage

#### Scenario: Delete multiple items' images
- **WHEN** 47 history items are deleted, each with 4 images (188 total)
- **THEN** all 188 images are deleted from storage

### Requirement: Log errors and continue on partial failure
The system SHALL log any deletion errors but continue attempting to delete remaining items rather than rolling back.

#### Scenario: Image deletion fails for one item
- **WHEN** deletion of a history item succeeds but one of its 4 images fails to delete
- **THEN** the system logs the error, continues deleting remaining items and images, and completes the operation

#### Scenario: Multiple failures logged
- **WHEN** 5 items fail to delete out of 47 marked for deletion
- **THEN** the system logs each failure and completes deletion of the remaining 42 items

### Requirement: Report deletion results to user
The system SHALL print a summary showing how many items and images were successfully deleted.

#### Scenario: Successful completion
- **WHEN** all deletions complete (with or without logged errors)
- **THEN** the system prints "Deleted 47 history items and 188 images" (or appropriate counts)

#### Scenario: Partial success with errors
- **WHEN** deletions complete but some errors were logged
- **THEN** the system prints the summary counts and a note like "3 errors occurred during deletion. Check logs for details."

### Requirement: Use environment variables for database connection
The system SHALL read Supabase credentials from environment variables to connect to the database and storage.

#### Scenario: Connect via .env.local
- **WHEN** the script starts
- **THEN** it reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`

#### Scenario: Credentials missing
- **WHEN** required environment variables are not available
- **THEN** the script exits with an error message indicating which credentials are missing

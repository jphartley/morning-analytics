## ADDED Requirements

### Requirement: Guarded per-analysis deletion
The system SHALL let an authenticated user initiate deletion of an analysis they own from its history entry and from the selected-analysis view, and SHALL require explicit confirmation before deleting any data.

#### Scenario: Opening the delete action does not delete data
- **WHEN** a user opens an analysis menu and chooses the delete action
- **THEN** the system SHALL show a confirmation dialog without deleting the analysis or its images

#### Scenario: Selecting a history entry is non-destructive
- **WHEN** a user selects a history entry normally
- **THEN** the system SHALL open the analysis without initiating deletion

### Requirement: Informative and accessible confirmation
The delete confirmation SHALL identify the analysis by date, warn that generated images will also be permanently removed, expose dialog semantics, trap focus while open, and allow cancellation by keyboard or pointer without deleting data.

#### Scenario: Confirmation communicates deletion scope
- **WHEN** the delete confirmation opens for a saved analysis
- **THEN** it SHALL identify the entry by date and state that its generated images will also be permanently deleted

#### Scenario: Cancellation restores useful focus
- **WHEN** the user cancels the dialog or presses Escape while deletion is not in progress
- **THEN** the system SHALL close the dialog, preserve the analysis, and restore focus to the opener or a stable fallback control if the opener no longer exists

### Requirement: Ownership-checked scoped deletion
The server SHALL verify that the requested analysis belongs to the authenticated user before any destructive operation and SHALL restrict storage deletion to objects under that analysis's own storage prefix.

#### Scenario: Owner deletes an analysis and its images
- **WHEN** the owner confirms deletion of an analysis with generated image objects
- **THEN** the server SHALL remove the owned objects under that analysis's storage prefix and delete the analysis row

#### Scenario: Cross-user deletion is rejected
- **WHEN** a delete request targets an analysis owned by another user
- **THEN** the server SHALL reject the request and SHALL NOT delete the row or any storage object

#### Scenario: Foreign paths are excluded from deletion
- **WHEN** stored image metadata contains a path outside the requested analysis's storage prefix
- **THEN** the server SHALL exclude that path from the storage deletion set

### Requirement: Retry-safe cross-store cleanup
The system SHALL remove storage objects before deleting the analysis row, SHALL report success only after both operations complete, and SHALL return a support-safe failure that can be retried without falsely reporting completion.

#### Scenario: Storage cleanup fails
- **WHEN** one or more owned storage objects cannot be removed
- **THEN** the system SHALL report failure, keep the analysis row, and allow the deletion to be retried safely

#### Scenario: Row deletion fails after storage cleanup
- **WHEN** storage cleanup completes but deletion of the analysis row fails
- **THEN** the system SHALL report failure and a retry SHALL be able to finish deleting the row even though the storage objects are already absent

#### Scenario: All cleanup completes
- **WHEN** storage cleanup and row deletion both succeed
- **THEN** the system SHALL report the analysis as deleted

### Requirement: Deterministic post-delete experience
After successful deletion, the system SHALL remove the analysis from history, announce success accessibly, and change the selected view only when the deleted analysis was the one being viewed.

#### Scenario: Selected analysis is deleted
- **WHEN** the user deletes the analysis currently shown in the history view
- **THEN** the system SHALL select a neighboring analysis, preferring the newer neighbor, or return to the new-analysis state when no neighbor exists

#### Scenario: Non-selected analysis is deleted
- **WHEN** the user deletes a different analysis from the history list
- **THEN** the current selected-analysis view SHALL remain unchanged while the deleted entry disappears from history

#### Scenario: Successful deletion is announced
- **WHEN** deletion completes successfully
- **THEN** the system SHALL provide an accessible confirmation that the analysis was deleted

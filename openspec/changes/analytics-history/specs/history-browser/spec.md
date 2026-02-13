## ADDED Requirements

### Requirement: Two-column page layout
The main page SHALL display a two-column layout with a history sidebar on the left and main content area on the right.

#### Scenario: Layout structure
- **WHEN** user views the main page
- **THEN** history sidebar appears on the left
- **AND** input form and analysis results appear on the right
- **AND** layout is responsive (sidebar may collapse on mobile)

### Requirement: History sidebar displays entries
The sidebar SHALL display a flat list of past analysis entries, sorted reverse chronologically with newest entries at the top.

#### Scenario: Display history list
- **WHEN** page loads with existing analyses
- **THEN** sidebar shows list of entries
- **AND** entries are sorted newest first
- **AND** each entry shows date and time (e.g., "Feb 13, 10:42 AM")

#### Scenario: Empty history state
- **WHEN** no analyses exist
- **THEN** sidebar displays a message indicating no history yet

### Requirement: Entry shows date and time
Each history entry SHALL display the analysis timestamp formatted as date and time with hours and minutes.

#### Scenario: Timestamp formatting
- **WHEN** displaying a history entry
- **THEN** timestamp shows in format like "Feb 13, 10:42 AM"
- **AND** uses user's local timezone

### Requirement: Click entry loads analysis
Clicking a history entry SHALL load that analysis into the main content area, displaying the full input text, analysis text, and all images.

#### Scenario: Load historical analysis
- **WHEN** user clicks a history entry
- **THEN** main content area displays the selected analysis
- **AND** shows the original input text
- **AND** shows the analysis text
- **AND** shows all 4 generated images

#### Scenario: Visual indication of selected entry
- **WHEN** a history entry is selected
- **THEN** that entry is visually highlighted in the sidebar

### Requirement: New analysis appears in history
After completing a new analysis, it SHALL immediately appear at the top of the history sidebar.

#### Scenario: History updates after new analysis
- **WHEN** user completes a new analysis (text + images)
- **THEN** new entry appears at top of sidebar
- **AND** entry shows current timestamp
- **AND** user can click it to re-view the analysis

### Requirement: Return to input mode
The user SHALL be able to return to the input form to create a new analysis while viewing a historical entry.

#### Scenario: Start new analysis from history view
- **WHEN** user is viewing a historical analysis
- **THEN** a "New Analysis" button or clear action is available
- **AND** clicking it clears the main area and shows the input form

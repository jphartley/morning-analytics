## MODIFIED Requirements

### Requirement: Display analysis reading estimate
The AnalysisPanel component SHALL display a reading time estimate for non-empty analysis text in insight and test modes. The AnalysisPanel component SHALL hide reading metadata in quiet mode.

#### Scenario: Fresh analysis shows reading estimate
- **WHEN** a newly generated analysis is rendered in AnalysisPanel in `insight` or `test` mode
- **THEN** the panel SHALL display a reading time estimate near the "Analysis" heading

#### Scenario: History analysis shows reading estimate
- **WHEN** a historical analysis is rendered in AnalysisPanel in `insight` or `test` mode
- **THEN** the panel SHALL display a reading time estimate near the "Analysis" heading

#### Scenario: Quiet mode hides reading estimate
- **WHEN** a newly generated or historical analysis is rendered in `quiet` mode
- **THEN** the panel SHALL NOT display reading time or analysis word count metadata

### Requirement: Display estimate subtly with word count
The reading estimate SHALL be styled as secondary metadata and SHALL include the calculated word count when it is visible.

#### Scenario: Estimate includes word count
- **WHEN** AnalysisPanel displays a reading time estimate in `insight` or `test` mode
- **THEN** the metadata SHALL include the word count in the format "(N words)"

#### Scenario: Estimate uses muted styling
- **WHEN** AnalysisPanel displays a reading time estimate in `insight` or `test` mode
- **THEN** the metadata SHALL use a small, muted visual style that does not compete with the analysis heading or body

# analysis-reading-time Specification

## Purpose
TBD - created by archiving change analysis-reading-time-estimate. Update Purpose after archive.
## Requirements
### Requirement: Display analysis reading estimate
The AnalysisPanel component SHALL display a reading time estimate for non-empty analysis text.

#### Scenario: Fresh analysis shows reading estimate
- **WHEN** a newly generated analysis is rendered in AnalysisPanel
- **THEN** the panel SHALL display a reading time estimate near the "Analysis" heading

#### Scenario: History analysis shows reading estimate
- **WHEN** a historical analysis is rendered in AnalysisPanel
- **THEN** the panel SHALL display a reading time estimate near the "Analysis" heading

### Requirement: Calculate estimate from readable word count
The reading time estimate SHALL be calculated from the analysis word count at 200 words per minute, rounded up to the nearest minute.

#### Scenario: Estimate rounds up
- **WHEN** readable analysis text contains 401 words
- **THEN** the reading time estimate SHALL display "~3 min read"

#### Scenario: Non-empty short analysis uses one minute minimum
- **WHEN** readable analysis text contains fewer than 200 words
- **THEN** the reading time estimate SHALL display "~1 min read"

### Requirement: Exclude Markdown syntax from count
The word count used for reading time SHALL count readable analysis words and SHALL NOT count Markdown syntax characters as words.

#### Scenario: Markdown emphasis does not inflate count
- **WHEN** analysis text contains Markdown emphasis such as `**important**` or `*meaningful*`
- **THEN** the word count SHALL count the emphasized words without counting the asterisks as separate words

#### Scenario: Markdown headings and lists do not inflate count
- **WHEN** analysis text contains headings or list markers such as `### Theme` or `- Insight`
- **THEN** the word count SHALL count the readable heading and list text without counting Markdown markers as words

#### Scenario: Markdown links keep link text
- **WHEN** analysis text contains a Markdown link such as `[source text](https://example.com)`
- **THEN** the word count SHALL count "source text" and SHALL NOT count the URL or Markdown bracket syntax

### Requirement: Display estimate subtly with word count
The reading estimate SHALL be styled as secondary metadata and SHALL include the calculated word count.

#### Scenario: Estimate includes word count
- **WHEN** AnalysisPanel displays a reading time estimate
- **THEN** the metadata SHALL include the word count in the format "(N words)"

#### Scenario: Estimate uses muted styling
- **WHEN** AnalysisPanel displays a reading time estimate
- **THEN** the metadata SHALL use a small, muted visual style that does not compete with the analysis heading or body


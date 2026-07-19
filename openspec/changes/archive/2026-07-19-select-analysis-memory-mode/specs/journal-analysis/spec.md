## MODIFIED Requirements

### Requirement: Enrich journal analysis with relevant contextual memory
The system SHALL honor the effective analysis memory mode when generating a daily analysis and SHALL provide any selected bounded user-scoped context to the supported analyst persona.

#### Scenario: Memory-enabled analysis has relevant context
- **WHEN** the user submits non-empty journal text in a memory-enabled mode and the relevance selector returns valid memories
- **THEN** the system SHALL provide the bounded compact memory context with the original journal text to the selected analyst persona
- **AND** it SHALL instruct the analyst to treat today's writing as primary and memory as potentially uncertain background

#### Scenario: No-memory analysis is requested
- **WHEN** the user submits non-empty journal text in No memory mode
- **THEN** the system SHALL skip contextual-memory relevance selection
- **AND** it SHALL provide no contextual memory to the selected analyst persona
- **AND** it SHALL return an empty memory-context snapshot for the analysis

#### Scenario: Memory is unavailable in a memory-enabled mode
- **WHEN** the user has no memory store, no relevant selection, or a selector failure
- **THEN** the system SHALL continue to analyze the original journal text without memory

#### Scenario: User submits outside Test view
- **WHEN** the user submits an entry from Quiet or Insight view
- **THEN** the system SHALL use the memory-enabled analysis path

### Requirement: Update contextual memory after persistence
The system SHALL update contextual memory only after the chosen analysis is saved and SHALL keep memory-update status separate from the readable analysis result, regardless of whether memory informed that result.

#### Scenario: Memory-enabled single analysis is saved
- **WHEN** a memory-enabled single analysis is saved successfully
- **THEN** the system SHALL invoke memory update once using the original journal entry

#### Scenario: No-memory single analysis is saved
- **WHEN** a no-memory single analysis is saved successfully
- **THEN** the system SHALL invoke memory update once using the original journal entry
- **AND** the generated analysis SHALL remain recorded with an empty memory-context snapshot

#### Scenario: Blind-comparison result is saved
- **WHEN** the user saves the preferred blind-comparison result
- **THEN** the system SHALL invoke memory update once using the original journal entry
- **AND** it SHALL NOT update memory from the rejected result

#### Scenario: Analysis is not saved
- **WHEN** the analysis persistence step fails or the user leaves a comparison without saving
- **THEN** the system SHALL NOT add evidence from that entry to durable memory

#### Scenario: Memory update remains pending or fails
- **WHEN** the analysis is already displayed and its subsequent memory update is pending or fails
- **THEN** the analysis SHALL remain readable
- **AND** image generation and saved-history behavior SHALL not be invalidated by the memory outcome

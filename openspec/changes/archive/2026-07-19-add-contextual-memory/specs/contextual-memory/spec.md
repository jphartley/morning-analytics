## ADDED Requirements

### Requirement: Infer memory only from original journal writing
The system SHALL use a dedicated post-save AI operation to infer memory updates from the user's original journal entry and SHALL NOT use generated analyst text as autobiographical evidence.

#### Scenario: Completed daily analysis updates memory
- **WHEN** a preferred analysis has been saved successfully
- **THEN** the system SHALL submit the original journal text and compact existing memory catalog for memory inference
- **AND** the system SHALL apply validated memory operations for future analyses

#### Scenario: Analyst interpretation is excluded
- **WHEN** the system prepares a memory-update request
- **THEN** it SHALL NOT include the AI-generated analysis as source material

#### Scenario: Original writing is supplied as exact source blocks
- **WHEN** the system prepares a memory-update request for one journal entry
- **THEN** it SHALL divide the original writing into deterministic exact-text source blocks
- **AND** it SHALL provide all source blocks for that entry together in one inference call

#### Scenario: AI selects evidence by block identifier
- **WHEN** memory inference creates or updates a memory
- **THEN** the AI response SHALL reference a source block identifier rather than reproduce an evidence quotation
- **AND** the server SHALL validate the identifier and store the corresponding exact original block text as evidence

#### Scenario: AI returns create and update operations
- **WHEN** memory inference returns structured operations
- **THEN** new records SHALL be returned in a `creates` collection without a memory identifier
- **AND** changes to existing records SHALL be returned in an `updates` collection with an owned memory identifier

#### Scenario: Memory update fails
- **WHEN** post-save memory inference or persistence fails
- **THEN** the saved analysis SHALL remain available
- **AND** the system SHALL report the memory failure separately

### Requirement: Retain significant open-ended context
The system SHALL infer significant context without restricting memory to a fixed taxonomy and SHALL favor omitting minor details that are unlikely to change future interpretation.

#### Scenario: Significant life context appears
- **WHEN** an entry describes a recurring person, relationship, prevailing emotion, important plan, travel, holiday, or major life event with likely future relevance
- **THEN** the system SHALL be able to create or update a contextual memory

#### Scenario: Transient detail lacks future relevance
- **WHEN** an entry contains a minor one-off detail without persistence, recurrence, emotional weight, or likely future interpretive value
- **THEN** the system SHALL be able to return no memory operation for that detail

### Requirement: Consolidate related evidence
The system SHALL consolidate related observations into an evolving memory record and SHALL retain dated, grounded evidence separately from its compact summary.

#### Scenario: Later entry reinforces an existing memory
- **WHEN** new journal evidence refers to the same subject or theme as an existing memory
- **THEN** the system SHALL update that memory rather than create an unnecessary duplicate
- **AND** the system SHALL append the dated supporting excerpt

#### Scenario: Evidence can be inspected but is excluded from analysis context
- **WHEN** memory is used for a daily analysis
- **THEN** the system SHALL inject only the compact memory summary
- **AND** it SHALL NOT inject the accumulated evidence excerpts

### Requirement: Preserve uncertainty and subjective attribution
The system SHALL distinguish evidential confidence from temporal state and SHALL retain subjective characterizations as the writer's perspective rather than objective facts or diagnoses.

#### Scenario: Inference has limited support
- **WHEN** a relationship, interpretation, or other claim is inferred from limited evidence
- **THEN** the system SHALL retain it as unconfirmed or low-confidence context that later evidence can strengthen or weaken

#### Scenario: Writer characterizes another person
- **WHEN** an entry attributes a psychological or behavioral quality to another person
- **THEN** the memory SHALL describe the writer's perception or association
- **AND** it SHALL NOT convert the characterization into an objective diagnosis

#### Scenario: Event outcome cannot be determined
- **WHEN** the expected date of an upcoming event has passed and later writing does not establish whether it occurred
- **THEN** the system SHALL mark its temporal state uncertain

#### Scenario: Context becomes historical
- **WHEN** later evidence establishes that a memory is no longer current
- **THEN** the system SHALL retain it as inactive historical context rather than delete it

### Requirement: Select relevant memory with a dedicated AI step
The system SHALL use a persona-independent AI relevance selector over today's original journal text and the compact memory catalog before calling the daily analyst.

#### Scenario: Indirect reference matches earlier context
- **WHEN** today's writing contains an indirect or fuzzy reference that a stored memory explains
- **THEN** the selector SHALL be able to return that memory's identifier as relevant

#### Scenario: Selector input excludes provenance and analyses
- **WHEN** a relevance-selection request is created
- **THEN** it SHALL include compact memory fields needed for relevance
- **AND** it SHALL exclude evidence excerpts and previous generated analyses

#### Scenario: Selected identifiers are validated
- **WHEN** the selector returns memory identifiers
- **THEN** the server SHALL reject unknown or differently owned records before constructing prompt context

#### Scenario: Selection fails
- **WHEN** the relevance-selector call fails or returns no sufficiently relevant memory
- **THEN** the system SHALL continue with a memory-free daily analysis

### Requirement: Bound memory supplied to analysis
The system SHALL inject no more than five relevant memories and no more than 150 words of total memory context into a daily analysis.

#### Scenario: More than five memories appear relevant
- **WHEN** the selector ranks more than five memories as relevant
- **THEN** the server SHALL inject at most the five highest-ranked validated memories

#### Scenario: Selected summaries exceed the word allowance
- **WHEN** selected compact summaries total more than 150 words
- **THEN** the server SHALL omit lower-ranked content until the injected context is at most 150 words

#### Scenario: Few memories are relevant
- **WHEN** fewer than five memories meet the relevance threshold
- **THEN** the system SHALL inject only those memories
- **AND** it SHALL NOT fill the allowance with unrelated background

### Requirement: Share memory across personas and views
The system SHALL use the same user-scoped memory catalog and relevance process for every analyst persona and every view-density mode.

#### Scenario: User changes persona
- **WHEN** the same entry is analysed using a different supported persona
- **THEN** memory selection SHALL remain independent of the persona

#### Scenario: User leaves Test view
- **WHEN** the user analyses an entry in Quiet or Insight view
- **THEN** relevant contextual memory SHALL still be available to the analyst

### Requirement: Isolate memory by user
The system SHALL prevent a user from reading, selecting, updating, rebuilding, or resetting another user's memory or evidence.

#### Scenario: User reads the memory store
- **WHEN** an authenticated user requests memory records or evidence
- **THEN** the system SHALL return only records owned by that user

#### Scenario: Server receives a foreign memory identifier
- **WHEN** a server mutation references a memory not owned by the supplied authenticated user context
- **THEN** the system SHALL reject the mutation

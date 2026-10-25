# contextual-memory Specification

## Purpose

Define user-scoped contextual-memory inference, consolidation, provenance, uncertainty, relevance selection, and bounded injection into daily journal analysis.

## Requirements

### Requirement: Infer memory only from original journal writing
The system SHALL use a dedicated post-save AI operation to infer memory updates from an administrator's original journal entry and SHALL NOT use generated analyst text as autobiographical evidence. The system SHALL not invoke post-save memory inference or create or update memory for a normal-user analysis. Whether an administrator injected memory into a particular analysis SHALL NOT determine whether saving the preferred analysis performs post-save inference.

#### Scenario: Completed daily analysis updates memory
- **WHEN** an administrator's preferred analysis has been saved successfully
- **THEN** the system SHALL submit the original journal text and compact existing memory catalog for memory inference
- **AND** the system SHALL apply validated memory operations for future analyses

#### Scenario: Analyst interpretation is excluded
- **WHEN** the system prepares an administrator memory-update request
- **THEN** it SHALL NOT include the AI-generated analysis as source material

#### Scenario: Original writing is supplied as exact source blocks
- **WHEN** the system prepares a memory-update request for one administrator journal entry
- **THEN** it SHALL divide the original writing into deterministic exact-text source blocks
- **AND** it SHALL provide all source blocks for that entry together in one inference call

#### Scenario: AI selects evidence by block identifier
- **WHEN** memory inference creates or updates an administrator memory
- **THEN** the AI response SHALL reference a source block identifier rather than reproduce an evidence quotation
- **AND** the server SHALL validate the identifier and store the corresponding exact original block text as evidence

#### Scenario: AI returns create and update operations
- **WHEN** administrator memory inference returns structured operations
- **THEN** new records SHALL be returned in a `creates` collection without a memory identifier
- **AND** changes to existing records SHALL be returned in an `updates` collection with an owned memory identifier

#### Scenario: Memory update fails
- **WHEN** post-save administrator memory inference or persistence fails
- **THEN** the saved analysis SHALL remain available
- **AND** the system SHALL report the memory failure separately

#### Scenario: Normal user saves an analysis
- **WHEN** a user-role account successfully saves an analysis
- **THEN** the system SHALL not run a memory inference request
- **AND** the saved analysis SHALL have an empty or null memory-context field

#### Scenario: Administrator saves an analysis that did not inject memory
- **WHEN** an administrator saves the preferred analysis after selecting a Test/Debug option that omitted memory from that analysis
- **THEN** the system SHALL still infer and persist memory from the original journal entry
- **AND** it SHALL continue to exclude the generated analysis from the inference source

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
The system SHALL use the same user-scoped memory catalog and relevance process for every administrator analyst persona and view-density mode, subject to an explicit Test/Debug memory experiment selection. For a normal user, the supported application flow SHALL not retrieve, select, inject, infer, create, or update contextual memory and SHALL not expose memory state or controls. Existing memory records owned by an account that currently has the `user` role SHALL remain stored and unchanged rather than being deleted.

#### Scenario: User changes persona
- **WHEN** an administrator analyses the same entry using a different supported persona
- **THEN** memory selection SHALL remain independent of the persona

#### Scenario: User leaves Test view
- **WHEN** an administrator analyses an entry in Quiet or Insight view
- **THEN** relevant contextual memory SHALL still be available to the analyst

#### Scenario: Normal user changes analyst or view
- **WHEN** a user-role account changes between Quiet, Insights, or supported analysts
- **THEN** the resulting analysis SHALL remain memory-free
- **AND** the system SHALL not read or mutate the account's contextual-memory catalog

#### Scenario: Normal user has existing memory records
- **WHEN** an account with existing contextual-memory records resolves to the `user` role
- **THEN** those records SHALL remain dormant and unchanged
- **AND** they SHALL not be selected or injected into an analysis

#### Scenario: Administrator suppresses memory for a Test/Debug analysis
- **WHEN** an administrator selects a Test/Debug experiment option that omits contextual memory
- **THEN** the analysis SHALL not receive memory context
- **AND** the account's stored memory catalog SHALL remain available for later administrator analyses

### Requirement: Isolate memory by user
The system SHALL require a verified administrator identity to read, select, update, rebuild, or reset live contextual memories or evidence, and SHALL restrict that access to the administrator's own records. These restrictions SHALL apply to both application operations and direct authenticated database requests. Existing memory records for normal-user accounts SHALL remain dormant and SHALL NOT be deleted by this change. Historical snapshots stored in an account's own analyses are not access to the live memory store.

#### Scenario: User reads the memory store
- **WHEN** a verified administrator requests memory records or evidence
- **THEN** the system SHALL return only records owned by that administrator

#### Scenario: Server receives a foreign memory identifier
- **WHEN** a mutation references a memory, evidence parent, or source analysis owned by another account
- **THEN** the system SHALL reject the mutation

#### Scenario: Normal user directly accesses live memory tables
- **WHEN** a normal user queries or mutates memory or evidence using their authenticated database session
- **THEN** database grants and policies SHALL deny the operation or expose no rows as appropriate
- **AND** the account's existing memories SHALL remain dormant

#### Scenario: Account is demoted
- **WHEN** an administrator becomes a normal user
- **THEN** subsequent requests SHALL lose access to live memory and experiments
- **AND** stored memories SHALL remain available if the operator later promotes the account again

#### Scenario: Owner reads an old analysis
- **WHEN** a normal user retrieves their own historical analysis containing a stored memory-context snapshot
- **THEN** ownership policy SHALL continue to permit that analysis read
- **AND** the read SHALL NOT enable live memory queries, inference, or experiment controls

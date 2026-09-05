## MODIFIED Requirements

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

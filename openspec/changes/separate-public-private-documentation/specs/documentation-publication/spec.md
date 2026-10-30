## ADDED Requirements

### Requirement: Public documentation boundary
The repository SHALL define public and private content categories. Security
assessments, sensitive planning and operational evidence SHALL remain private.

#### Scenario: Public clone
- **WHEN** a contributor reads public documentation
- **THEN** generic procedures and intended behavior are available without links to private records

### Requirement: Preserve private records outside tracking
Migrated records SHALL be preserved locally under an ignored private root and
removed from tracked paths. Legacy sensitive paths SHALL be ignored.

#### Scenario: Migrated record
- **WHEN** a sensitive record is relocated
- **THEN** its local contents are retained and its destination is ignored

### Requirement: Block staged ignored content
The local pre-commit hook SHALL reject added or modified ignored files, including
force-added files, while allowing deletion of previously tracked material.

#### Scenario: Force-added private file
- **WHEN** a private file is staged with force
- **THEN** the publication check fails before secret scanning

#### Scenario: Removal from tracking
- **WHEN** a previously tracked private file is staged for deletion
- **THEN** the publication check allows that deletion

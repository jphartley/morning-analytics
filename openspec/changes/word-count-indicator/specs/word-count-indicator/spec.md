## ADDED Requirements

### Requirement: Live word count display
The JournalInput component SHALL display a word count below the editor that updates in real time as the user types or pastes text.

#### Scenario: Word count updates on typing
- **WHEN** the user types text into the journal editor
- **THEN** the word count display SHALL update to reflect the current number of words

#### Scenario: Word count updates on paste
- **WHEN** the user pastes text into the journal editor
- **THEN** the word count display SHALL update to reflect the total word count including pasted content

#### Scenario: Empty editor shows zero
- **WHEN** the journal editor contains no text
- **THEN** the word count display SHALL show "0 words"

#### Scenario: Single word shows singular form
- **WHEN** the journal editor contains exactly one word
- **THEN** the word count display SHALL show "1 word"

### Requirement: Auto-analyze threshold indicator
The word count display SHALL visually indicate when the 300-word auto-analyze threshold has been reached.

#### Scenario: Below threshold
- **WHEN** the word count is less than 300
- **THEN** the word count SHALL be displayed in muted styling (subtle, non-distracting)

#### Scenario: At or above threshold
- **WHEN** the word count is 300 or greater
- **THEN** the word count SHALL be displayed in accent color
- **AND** the text "(auto-analyze ready)" SHALL appear alongside the count

### Requirement: No layout shift
The word count display SHALL NOT cause layout shift as the number of digits changes.

#### Scenario: Digit count increases
- **WHEN** the word count increases from a lower digit count to a higher one (e.g., 99 to 100)
- **THEN** the surrounding layout (editor and button) SHALL NOT shift position

### Requirement: Word count works for both fresh and history views
The word count SHALL be visible for both fresh input and when viewing historical analyses.

#### Scenario: Fresh input
- **WHEN** the user is composing a new journal entry
- **THEN** the word count is displayed and updates in real time

#### Scenario: History view with input text
- **WHEN** the user views a historical analysis that has input text loaded into the editor
- **THEN** the word count is displayed reflecting the historical text length

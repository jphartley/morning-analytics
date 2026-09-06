## Purpose

Define the focused, copy-locked experience shown while an authenticated user has no completed reflections in their history.

## ADDED Requirements

### Requirement: First-use layout prioritizes writing
When the application is idle and the authenticated user's history is empty, the system SHALL render a first-use layout that prioritizes the journal editor and its primary action ahead of the explanatory guide. The guide SHALL be the only intentional difference in the central analysis workspace before and after a user's first completed reflection.

#### Scenario: Empty-history user opens a new analysis
- **WHEN** an authenticated user with no saved analyses opens the idle new-analysis view
- **THEN** the application SHALL show `Insights From Your Morning Pages` as the centered in-page subtitle
- **AND** it SHALL NOT show a large in-page `Morning Analytics` heading
- **AND** it SHALL render the journal editor and `Reflect on My Pages` button before the `How it works` guide in reading order

#### Scenario: User with saved history opens a new analysis
- **WHEN** an authenticated user with one or more saved analyses opens the idle new-analysis view
- **THEN** the application SHALL show `Insights From Your Morning Pages` as the centered in-page subtitle
- **AND** it SHALL NOT show a large in-page `Morning Analytics` heading
- **AND** it SHALL NOT render the first-use `How it works` guide

### Requirement: First-use guide uses canonical copy verbatim
The first-use guide SHALL render the following canonical content verbatim. Implementations MUST NOT substitute synonyms, alter capitalization, alter punctuation, change the contraction style, add qualifying copy, or change the agreed step order.

#### Scenario: Canonical guide content is shown
- **WHEN** the first-use guide is rendered
- **THEN** its heading SHALL be `How it works`
- **AND** its introductory sentence SHALL be `Once you've finished writing, you'll be offered an analysis and a set of images to deepen your practice.`
- **AND** its first step SHALL have the title `Write or Paste` and the description `Share whatever is present for you right now.`
- **AND** its second step SHALL have the title `Explore the Patterns` and the description `Receive a reflection on the themes in your writing.`
- **AND** its third step SHALL have the title `Deepen with Art` and the description `Receive images inspired by the themes in your writing.`

#### Scenario: Introductory sentence is emphasized
- **WHEN** the first-use guide is rendered
- **THEN** the complete introductory sentence `Once you've finished writing, you'll be offered an analysis and a set of images to deepen your practice.` SHALL receive bold emphasis

### Requirement: Journal editor has canonical affordances for every new analysis
The journal editor SHALL give the same concise, literal invitation to begin and use the same primary-action label for every idle new-analysis view, regardless of whether the user has saved history.

#### Scenario: Empty editor is displayed
- **WHEN** an authenticated user opens an empty journal editor for a new analysis
- **THEN** the editor SHALL show the placeholder `Write or paste your morning pages here`
- **AND** the primary action SHALL be labeled `Reflect on My Pages`

#### Scenario: Editor contains writing
- **WHEN** the user enters non-empty writing in the first-use editor
- **THEN** the `Reflect on My Pages` action SHALL become available according to the existing submission rules
- **AND** submitting it SHALL retain the existing analysis, image-generation, and persistence behavior

### Requirement: Empty-history sidebar describes future history without a redundant action
During first use, the history sidebar SHALL communicate where completed reflections will appear without showing an action that only restarts the already-empty new-analysis view.

#### Scenario: First-use sidebar is displayed
- **WHEN** an authenticated user with no saved analyses is viewing the idle first-use layout
- **THEN** the sidebar SHALL display `Your reflections will appear here.`
- **AND** it SHALL NOT display `+ New Analysis`

#### Scenario: History gains the first completed reflection
- **WHEN** the user's first completed reflection is saved
- **THEN** the sidebar SHALL resume its existing history-list and new-analysis-action behavior

### Requirement: Main controls remain stable across first use
The main analysis toolbar SHALL retain the same analyst-persona and detail-view controls before and after the user's first completed reflection.

#### Scenario: First-use top controls are displayed
- **WHEN** an authenticated user with no saved analyses is viewing the idle first-use layout
- **THEN** the analyst-persona selector SHALL remain available
- **AND** the detail-view icon controls SHALL remain available according to their current role and capability rules

#### Scenario: Analysis transitions out of first use
- **WHEN** the user has at least one saved analysis or is viewing a completed reflection
- **THEN** the existing detail-view icon controls SHALL remain available according to their current role and capability rules

### Requirement: Unchanged first-use controls remain unobtrusive
The first-use experience SHALL preserve account controls and palette personalization without adding explanatory or persistence copy beyond the locked guide, editor, and empty-history text.

#### Scenario: First-use screen is rendered
- **WHEN** an authenticated user with no saved analyses views the idle first-use layout
- **THEN** the existing account controls and palette picker SHALL remain available
- **AND** the interface SHALL NOT add a new privacy or persistence message

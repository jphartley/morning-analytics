## ADDED Requirements

### Requirement: Semantic error color tokens

The system SHALL expose semantic error color tokens alongside the existing palette tokens so error UI can use reusable utilities instead of hardcoded red classes.

#### Scenario: Error token utilities are available

- **WHEN** the application CSS loads
- **THEN** the CSS custom properties `--error`, `--error-muted`, `--error-strong`, `--error-surface`, `--error-surface-strong`, `--error-border`, and `--error-border-strong` SHALL be defined
- **THEN** Tailwind utilities derived from those tokens SHALL be available for text, background, and border styling

#### Scenario: Error tokens survive palette switches

- **WHEN** the user changes the active palette
- **THEN** semantic error utilities continue to resolve without requiring hardcoded red utility classes in components

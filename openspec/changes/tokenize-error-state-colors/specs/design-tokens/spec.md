## MODIFIED Requirements

### Requirement: Centralized color palette via CSS custom properties

The system SHALL define all UI colors as CSS custom properties in `globals.css` under `:root`, registered as Tailwind theme colors via `@theme inline`. Components SHALL reference these as Tailwind utility classes (e.g., `bg-page`, `text-ink`, `border-outline`) instead of hardcoded color classes.

#### Scenario: Palette tokens are defined

- **WHEN** the application loads
- **THEN** the following CSS custom properties are available: `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--accent-hover`, `--accent-soft`, `--border`, `--error-subtle`, `--error-soft`, `--error-border`, `--error-border-strong`, `--error`, `--error-muted`, `--error-strong`
- **THEN** the following Tailwind utilities are generated: `bg-page`, `bg-surface`, `text-ink`, `text-ink-muted`, `bg-accent`, `bg-accent-hover`, `bg-accent-soft`, `border-outline`, `bg-error-subtle`, `bg-error-soft`, `border-error-border`, `border-error-border-strong`, `text-error`, `text-error-muted`, `text-error-strong`

#### Scenario: Components use tokens

- **WHEN** any component renders
- **THEN** it uses Tailwind token utilities (e.g., `bg-page`, `text-ink`) instead of hardcoded color classes (e.g., `bg-stone-100`, `text-stone-800`)

#### Scenario: Error surfaces use semantic error tokens

- **WHEN** the application renders validation errors, history load errors, save-error toasts, or error-state illustrations
- **THEN** those UI surfaces use semantic error token utilities from the shared palette system instead of hardcoded `red-*` utility classes

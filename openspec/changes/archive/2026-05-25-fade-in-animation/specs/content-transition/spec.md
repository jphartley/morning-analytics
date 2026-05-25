## ADDED Requirements

### Requirement: Fade-in animation on AnalysisPanel mount

The AnalysisPanel component SHALL animate in with a combined fade and upward slide when it first renders during a fresh analysis (transitioning from "analyzing" to "text-ready" state).

#### Scenario: Fresh analysis appears with animation

- **WHEN** the app transitions from "analyzing" to "text-ready" state
- **THEN** the AnalysisPanel SHALL fade in from opacity 0 to opacity 1
- **AND** the panel SHALL slide upward from an 8px offset to its final position
- **THEN** the animation SHALL complete in approximately 300 milliseconds with ease-out timing

#### Scenario: History view loads without animation

- **WHEN** the user views a historical analysis from the sidebar
- **THEN** the AnalysisPanel SHALL appear without the fade-in animation

### Requirement: Fade-in animation on ImageGrid mount

The ImageGrid component SHALL animate in with the same combined fade and upward slide when it first renders during a fresh analysis (transitioning from "text-ready" to "complete" state).

#### Scenario: Images appear with animation

- **WHEN** the app transitions from "text-ready" to "complete" state
- **THEN** the ImageGrid SHALL fade in from opacity 0 to opacity 1
- **AND** the grid SHALL slide upward from an 8px offset to its final position
- **THEN** the animation SHALL complete in approximately 300 milliseconds with ease-out timing

#### Scenario: History view images load without animation

- **WHEN** the user views a historical analysis that includes images
- **THEN** the ImageGrid SHALL appear without the fade-in animation

### Requirement: Respect reduced motion preference

The fade-in animations SHALL be disabled for users who have enabled the "prefers-reduced-motion: reduce" operating system setting.

#### Scenario: Reduced motion enabled

- **WHEN** the user's system has prefers-reduced-motion set to "reduce"
- **THEN** the AnalysisPanel and ImageGrid SHALL appear instantly without any animation

### Requirement: No layout shift during animation

The fade-in animation SHALL NOT cause any layout shift in surrounding elements. The animated element SHALL occupy its final layout position from the start.

#### Scenario: Animation does not displace content

- **WHEN** the AnalysisPanel or ImageGrid is animating in
- **THEN** surrounding elements (buttons, headers, other panels) SHALL NOT shift position
- **AND** the animated element SHALL occupy its full final dimensions throughout the animation

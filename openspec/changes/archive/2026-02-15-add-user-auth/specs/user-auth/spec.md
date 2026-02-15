## ADDED Requirements

### Requirement: Email/password signup
The system SHALL allow users to create a new account using an email address and password via the signup page.

#### Scenario: Successful signup
- **WHEN** user enters valid email and password on `/signup`
- **THEN** account is created, user receives confirmation email, and signup succeeds

#### Scenario: Duplicate email
- **WHEN** user attempts to signup with an email already registered
- **THEN** signup fails with error message "Email already in use"

#### Scenario: Invalid email format
- **WHEN** user attempts to signup with invalid email format (e.g., "notanemail")
- **THEN** signup fails with validation error before API call

#### Scenario: Weak password
- **WHEN** user attempts to signup with password less than 8 characters
- **THEN** signup fails with validation error "Password must be at least 8 characters"

### Requirement: Email/password signin
The system SHALL allow users to sign in using their registered email and password.

#### Scenario: Successful signin
- **WHEN** user enters correct email and password on `/signin`
- **THEN** user is authenticated and redirected to main app

#### Scenario: Incorrect password
- **WHEN** user enters correct email but wrong password
- **THEN** signin fails with generic error "Invalid email or password"

#### Scenario: Unregistered email
- **WHEN** user attempts to signin with email not registered
- **THEN** signin fails with generic error "Invalid email or password"

### Requirement: Email confirmation is optional for MVP
The system SHALL allow users to signin before confirming their email address. Email confirmation will be enforced in future versions (see TechnicalDebt.md).

#### Scenario: Signin before confirmation
- **WHEN** user signs up and immediately attempts to signin without clicking confirmation link
- **THEN** signin succeeds (confirmation is optional for MVP)

#### Scenario: Email confirmation in future
- **WHEN** email confirmation enforcement is added in future versions
- **THEN** users MUST confirm email before accessing the app (migration handled separately)

## ADDED Requirements

### Requirement: Signup establishes a normal-user application profile
The system SHALL create a persisted `user` role record as part of completing account creation without requiring the person to provide any additional signup information.

#### Scenario: Email/password signup succeeds
- **WHEN** a person completes the existing email/password signup flow
- **THEN** the account SHALL have a normal-user application profile when it next enters the authenticated app

#### Scenario: Profile creation is retried safely
- **WHEN** signup, confirmation, or session initialization repeats for an account that already has a profile
- **THEN** the system SHALL retain the existing role and SHALL NOT create a duplicate profile

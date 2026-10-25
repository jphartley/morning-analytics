# Server action authorization Specification

## Purpose

Define identity, capability, and resource checks for server operations so crafted requests cannot impersonate another account or use privileged services without permission.

## Requirements

### Requirement: Verify the caller before protected operations
Every protected server operation SHALL derive identity from a server-verified session. Caller-supplied user IDs, roles, decoded but unverified tokens, and browser UI state SHALL NOT establish authority. Authentication SHALL precede application-data access, storage changes, and provider calls; authentication infrastructure requests are permitted to establish identity.

#### Scenario: Caller has no valid credential
- **WHEN** a request has missing, malformed, forged, or expired credentials that cannot be refreshed legitimately
- **THEN** the operation SHALL fail without reading journal or memory data, changing storage, or invoking a provider

#### Scenario: Caller supplies someone else's identity
- **WHEN** account A sends account B's user ID or an administrator role in a crafted request
- **THEN** those values SHALL NOT change the identity or capabilities established by A's verified session
- **AND** a legacy action payload SHALL NOT fall back to caller-supplied identity

#### Scenario: Authorization service is unavailable
- **WHEN** the server cannot verify the session
- **THEN** it SHALL fail closed with a recoverable authentication error and no protected side effects

### Requirement: Authorize each operation and referenced resource
Every protected operation SHALL check the verified actor's current capabilities and any referenced resource ownership before protected reads, mutation, or paid work. Missing and foreign resources SHALL produce equivalent user-facing unavailable responses without disclosing another account's data.

#### Scenario: Account targets a foreign analysis
- **WHEN** account A requests deletion, regeneration, or memory inference for account B's analysis
- **THEN** the request SHALL fail without exposing B's journal, deleting images, or starting paid work

#### Scenario: Account requests another memory store
- **WHEN** account A crafts a memory read, reset, preparation, or rebuild request targeting B
- **THEN** the request SHALL NOT read, reset, rebuild, or disclose B's memories, evidence, or entry identifiers

#### Scenario: Privileged experiment is forged
- **WHEN** a normal user directly requests comparison, memory diagnostics, memory mutation, a non-default model, or a provider override
- **THEN** the server SHALL reject the restricted request before any experiment or provider side effect
- **AND** omitted options SHALL resolve to the normal-user defaults, including no contextual memory

#### Scenario: Authorized administrator uses an experiment
- **WHEN** a verified administrator requests an allowed experiment on their own content
- **THEN** the server SHALL permit it only when applicable server feature gates also allow it
- **AND** the administrator SHALL NOT gain cross-user access

### Requirement: Restrict privileged image operations to owned resources
Privileged image operations SHALL accept only server-authorized resource locations. A supplied path, URL, analysis identifier, or metadata field SHALL NOT by itself authorize storage access or grant ownership of pending generation output.

#### Scenario: Forged image location
- **WHEN** a save, regeneration, or deletion request contains another account's image path or a location outside the authorized resource scope
- **THEN** the server SHALL reject that location without reading, overwriting, or deleting the foreign object

#### Scenario: Image generation precedes analysis persistence
- **WHEN** images are generated before their analysis is saved
- **THEN** the system SHALL bind the pending output to the verified creator
- **AND** another account SHALL NOT claim that output by submitting its identifiers

#### Scenario: Existing owned analysis has legacy image paths
- **WHEN** the owner regenerates or deletes a saved analysis using the earlier image path format
- **THEN** the operation SHALL support that format only after checking the persisted analysis owner and constraining its object paths

### Requirement: Keep authentication failures safe and observable
The system SHALL provide consistent authentication, authorization, and unavailable-resource errors without returning credentials, journal text, memory evidence, or details about foreign resources. Server diagnostics SHALL exclude session credentials and sensitive request bodies.

#### Scenario: Session is lost during a user operation
- **WHEN** an action cannot establish a valid session
- **THEN** the client SHALL offer reauthentication without silently retrying a destructive or paid operation

#### Scenario: Independent requests run concurrently
- **WHEN** two accounts invoke server operations concurrently
- **THEN** each operation SHALL use only its own verified identity, role, and authorized data access

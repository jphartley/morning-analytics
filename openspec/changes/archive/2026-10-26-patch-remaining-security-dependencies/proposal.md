## Why

The 25 October dependency scan and the Security Backlog identify remaining advisory matches across the app, root scripts and validation dependency trees. Reassessing and patching applicable copies now will reduce known exposure while keeping package advisories distinct from confirmed attacks and avoiding unrelated dependency upgrades.

## What Changes

- Reassess all three lockfiles against current advisories and actual resolved versions, starting with `ws` across the app, root scripts and validation.
- Patch applicable copies of `protobufjs`, `source-map-js`, Vite, Vitest/`@vitest/mocker`, `@humanfs/node`, `brace-expansion` and `js-yaml`, or document an evidence-based reason for leaving an individual copy unchanged.
- Verify the relevant dependency graphs and project checks, keep development and test servers private, and record the resulting deployed versions and evidence.
- Update `SecurityDebt.md` with the outcome while preserving unresolved findings and the distinction between advisory matches and demonstrated exposure.
- Avoid forced upgrades and do not downgrade ESLint to address the withdrawn `braces` finding.
- Document the verified browser SSO followed by `npm login` recovery for the local JFrog mirror, and support its `npm-virtual` URLs in the lockfile cleanup helper.

## Capabilities

No user-facing behavior or system requirements change. This is dependency maintenance, assessment and documentation work; the change opts out of capability specs with `skip_specs: true`.

## Impact

Expected areas are the app, root and validation manifests/lockfiles; dependency assessment and verification records; `SecurityDebt.md`; the local npm login/runtime runbooks; and the lockfile registry cleanup helper. Exact versions and whether each finding is applicable will be selected after current advisory and dependency-tree review. No database, API, or environment-variable changes are expected. Production closure requires recording deployed versions; local lockfile changes alone do not establish deployed remediation.

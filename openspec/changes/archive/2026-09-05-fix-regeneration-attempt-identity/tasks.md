## 1. Attempt Identity

- [x] 1.1 Create a fresh provider/diagnostic attempt ID for every initial image-generation invocation while preserving the separate analysis ID for storage.
- [x] 1.2 Create a fresh provider/diagnostic attempt ID for every regeneration invocation while preserving the existing analysis ID for lookup, storage, and database append operations.

## 2. Regression Coverage

- [x] 2.1 Add server-action coverage proving repeated regeneration of one analysis passes distinct attempt IDs to the provider and diagnostics.
- [x] 2.2 Add BFL provider coverage proving separate attempt IDs derive different four-seed sets while retaining deterministic slot order.

## 3. Specification and Validation

- [x] 3.1 Validate the OpenSpec change and synchronize its corrected regeneration, BFL, and diagnostics requirements to canonical specs.
- [x] 3.2 Run focused provider/action tests, lint, lockfile-registry validation, and the production build.

## Why

The application locks framework, image-processing and HTTP-client versions that
predate the October 2026 security fixes. Patch these independently of the urgent
authorization follow-up so that a larger session redesign does not delay the
framework update. The Railway credential incident response is already complete
according to the operator.

## What Changes

- Upgrade Next.js to at least 16.4.1, align eslint-config-next, and select a
  compatible patched React/React DOM pair (19.2.9 on the existing 19.2 line if
  compatible with the selected framework release).
- Upgrade the direct Sharp dependency to at least 0.35.5, covering both Next.js
  image processing and the application grid splitter.
- Resolve application and validation Undici copies to at least 6.29.1 on their
  compatible 6.x line, using parent updates where possible and a documented,
  narrowly scoped override only if necessary.
- Strengthen the Node 22 runtime contract to require at least 22.23.4, align
  declarations and related metadata, and verify both build and running versions.
  Configure a Node-only exception to Railpack's release-age delay so a fresh
  security release is eligible while the runtime continues to select latest 22.x.
- Verify all three dependency trees, registry safety, normal application flows,
  and deployed versions; record evidence in the October remediation tracker.
- Recheck superseding advisories before selecting exact implementation versions.

## Capabilities

### New Capabilities

None. This change adds no user-facing feature.

### Modified Capabilities

- `node-version-pinning`: require a patched Node 22 runtime at or above 22.23.4
  across local development, verification and deployment. The operator selected
  latest 22.x with that minimum during implementation: both .nvmrc selectors
  remain 22, while engine constraints and readiness checks enforce the floor.

## Impact

Expected implementation areas are app and validation manifests/lockfiles, root
runtime declarations and lockfile metadata where needed, app/mise.toml, existing runtime
selection/verification helpers, and the Node/deployment documentation. No database
migration or permanent new environment variables are required. The temporary
NO_CACHE diagnostic setting was removed after production verification. Credential values must never
enter the artifacts or diagnostics.

The existing workflows for sign-in, analysis, Midjourney images and history must
remain functional. The image stack needs deployment-platform verification because
native Linux dependencies differ from the local Mac.

Server-side authorization, editor/Tiptap/Markdown-it updates, broader image-input
hardening, and Vite/Vitest maintenance remain separate tracked work. This change
does not clear those risks or claim a complete clean dependency scan. A necessary
transitive update may touch development dependencies, but avoid unrelated major
upgrades or npm audit fix --force.

Reference: [October remediation tracker](../../../docs/security-remediation-2026-10.md).

This directory contains the Next.js application for Morning Analytics.

For setup, environment configuration, and project documentation, see the
repository-level `README.md`.

Use the latest stable Node 22.x with minimum 22.23.4. The local `.nvmrc`
selects 22, while package.json and its lockfile declare `>=22.23.4 <23`.
Keep mise.toml's Node-only release-age exception for Railway builds. See the
[Node runtime runbook](../docs/node-runtime-runbook.md) for setup, the reason
for that exception and deployed-process verification.

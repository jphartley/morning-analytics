# Public and private material

Treat this repository and everything committed to it as public. Apply this rule
to documentation, OpenSpec, fixtures, screenshots, logs, issues, PR descriptions
and commit messages as well as source code.

| Public Git | Private storage only |
| --- | --- |
| Source code, migrations and reviewed synthetic tests | Credentials, tokens, environment values and real user content |
| Product behavior and intended security requirements | Security backlogs, assessments, unresolved findings and risk acceptance |
| Generic setup, build and deployment procedures using placeholders | Exploit recipes, reproduction evidence and attack preconditions tied to this deployment |
| Supported runtime policies and dependency manifests | Incident timelines, provider/account details, live audit results and production verification evidence |
| General troubleshooting and completed feature descriptions | Raw logs, database exports, private screenshots and remediation planning that describes security gaps |

A finding does not become suitable for publication simply because it was fixed,
archived or contains no secret. Publish a separate reviewed explanation of the
intended behavior when a public record is needed. Keep public OpenSpec artifacts
focused on requirements; security investigations and their change plans stay private.

## Local layout

`private/` is ignored in its entirety. Use:

- `private/security/backlog.md` for security work and completion criteria.
- `private/security/progress.md` for status and release evidence.
- `private/security/history/` and `private/security/assessments/` for findings.
- `private/security/openspec/` for sensitive change artifacts.
- `private/operations/` for deployment records and incident logs.

Legacy security-document paths are also ignored to prevent reintroduction.
Private files are local only: they are absent from fresh clones and are not
backed up by Git. Keep any required backup in an access-controlled location
outside this public repository. Do not put credential values in these Markdown
records; use the appropriate secret manager or provider settings.

Public documents must not link to private files. Refer to this policy instead;
local instructions may identify private paths without describing their contents.
Agents should consult private context when available and must not invent it
when working from a public clone.

## Before publishing

Review the actual proposed diff for sensitive context, including new files and
renames. Use synthetic fixtures and placeholders. Run the publication-boundary
check and the secret scans in [the Gitleaks runbook](gitleaks-runbook.md).

The pre-commit hook rejects added or modified files matching ignore rules,
including force-added private files, before running Gitleaks. Deletions remain
allowed so previously tracked material can be removed. The path check cannot
detect sensitive prose copied into an otherwise public file; human review is
still required. Local hooks must be installed and can be bypassed; this is not a
server-enforced publication control.

## Previously committed material

Ignoring or deleting a tracked file affects future snapshots after the removal
is committed and pushed. Existing commits, remote copies, forks and clones can
still contain it. History rewriting and remote cleanup require a separate,
explicitly approved operation; they cannot recall copies already obtained.
If credentials were exposed, revoke them regardless of history cleanup.

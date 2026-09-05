# Gitleaks secret-scanning runbook

Use Gitleaks before commits and pushes to prevent credentials, API keys, and
other secrets from entering Git history. It scans committed Git patches and
does not require or print values from ignored local environment files.

## New-Mac setup

Install Gitleaks with Homebrew:

```zsh
brew install gitleaks
```

Activate this repository's versioned Git hooks in each local checkout:

```zsh
cd /Users/jhartley/code/morning-analytics
git config core.hooksPath .githooks
```

The pre-commit hook scans staged changes with redacted output. It blocks a
commit if Gitleaks is unavailable or detects a possible secret. Do not bypass
it with `--no-verify` except while investigating a confirmed false positive.

## Manual release scan

Before pushing a release, scan the current repository history:

```zsh
cd /Users/jhartley/code/morning-analytics
gitleaks git --redact .
```

To scan the current tracked working-tree diff before staging it:

```zsh
gitleaks git --pre-commit --redact .
```

After staging, verify the exact proposed commit:

```zsh
gitleaks git --pre-commit --staged --redact .
```

For new, untracked files that have not yet been staged, scan the specific file
or directory directly:

```zsh
gitleaks dir --redact path/to/file-or-directory
```

Never scan or commit `app/.env.local`, other `.env*` files, local Supabase
state, or credential stores. Those files are ignored. A clean Gitleaks result
does not prove a secret is safe to share; it only means it did not match the
scanner's configured detection rules.

## If Gitleaks reports a finding

Treat it as a potential secret until proven otherwise. Do not paste the value
into chat, an issue, a commit message, or an allowlist. Remove it from the
proposed change and rotate it in the issuing service if it may have been
exposed. If a reviewed false positive truly needs an exception, add the minimum
specific ignore entry in a separate reviewable change and document why it is
safe.

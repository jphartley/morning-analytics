# Supabase CLI schema-change runbook

Use this runbook to deploy a reviewed migration from `supabase/migrations/` to
the linked Supabase project. It assumes the Supabase CLI is installed, the user
has already run `supabase login`, and this repository has been linked with
`supabase link`.

## Standard remote database authentication

Start remote database work with the project **database password** in the current
Terminal session. This is the standard procedure for this repository, not a
fallback to remember after the passwordless flow fails. It is separate from the
Supabase account login, application password, API keys and personal access token.

On 25 October 2026, the passwordless flow stalled at `Initialising login role`
for several minutes. Supplying `SUPABASE_DB_PASSWORD` completed the preview and
migration successfully; the operator also reported the same issue in an earlier
session. Do not start new remote database work by retrying that known failing
passwordless path.

The operator enters the password directly into the hidden prompt below. Agents
must not ask for it in chat, retrieve it from credential stores, or assume a
variable exported in the operator's Terminal is available in their own process.
For read-only inspection without shared CLI access, the operator can run the
reviewed query in the Supabase SQL Editor instead.

## Safe production workflow

From the repository root, run the password setup and migration preview together:

```zsh
read -s "SUPABASE_DB_PASSWORD?Supabase database password: "
echo
export SUPABASE_DB_PASSWORD
supabase db push --linked --dry-run --skip-vault
unset SUPABASE_DB_PASSWORD
```

Review the full list. It must contain the intended new migration(s) only. If
older migrations appear unexpectedly, stop before making any database change:
the remote migration history needs reconciliation. Do not use
`supabase db reset --linked` on production; it is destructive.

Use `--linked` explicitly: a future CLI major version will default to the local
database. These commands deploy SQL migrations only; `--skip-vault` prevents
unrelated Vault-secret synchronization from the local configuration.

After the preview is reviewed and the coordinated rollout is authorized, enter
the password again and apply only the intended migration(s):

```zsh
read -s "SUPABASE_DB_PASSWORD?Supabase database password: "
echo
export SUPABASE_DB_PASSWORD
supabase db push --linked --skip-vault
unset SUPABASE_DB_PASSWORD
```

Then run the migration-specific verification queries and deploy the compatible
application release when one is required.

These blocks clear the variable when the command returns. If the command is
interrupted, explicitly run `unset SUPABASE_DB_PASSWORD` before leaving the
Terminal. Use the same temporary-password setup for other linked database
commands that need a database connection.

Never add `SUPABASE_DB_PASSWORD` to `.zshrc`, `.zprofile`, `.env`, Railway, a
shell command line containing its value, or source control. Do not paste it into
chat or diagnostics. This temporary local CLI variable is not an application or
Railway variable. For an unattended CI migration, store it in that CI provider's
secret store and inject it only for the migration command.

## Connection failure after password setup

The CLI may connect through Supabase's pooler using a temporary login role. A
failure such as `cli_login_postgres`, `Connection terminated unexpectedly`, or
a pooler connection timeout can be an authentication, network or pooler problem
rather than a bad migration. A successful SQL Editor query does not establish
that the CLI's database connection works.

1. If still at login initialization after about 30 seconds, stop with Ctrl+C
   rather than waiting several minutes. Clear `SUPABASE_DB_PASSWORD` explicitly.
2. Confirm that the hidden prompt used the project database password and the
   export occurred in the same Terminal as the CLI command. Do not print the
   variable or reset credentials just to troubleshoot this known failure.
3. Disconnect any corporate VPN/proxy or try a personal network, then repeat the
   password-assisted dry run once. Keep the preview step; do not switch directly
   to applying migrations to test connectivity.

If the timeout remains after changing networks and using the database password,
inspect Supabase Database network restrictions and network bans before retrying
repeatedly. The documented pooler-bypass fallback requires IPv6 and the beta
CLI; use it only after checking the official current troubleshooting guidance.

Reference: [Supabase's password-based CLI fallback](https://supabase.com/kb/troubleshooting/supabase-cli-failed-sasl-auth-or-invalid-scram-server-final-message).

## Change handoff checklist

- Confirm the exact migration filename shown by `--dry-run`.
- Use session-only database-password authentication from the first remote attempt.
- Apply with `supabase db push --linked --skip-vault`; never use a remote reset for this workflow.
- Record migration-specific verification results without copying secrets.
- State whether a Railway deploy/redeploy is required by related app or
  environment-variable changes.

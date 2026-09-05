# Supabase CLI schema-change runbook

Use this runbook to deploy a reviewed migration from `supabase/migrations/` to
the linked Supabase project. It assumes the Supabase CLI is installed, the user
has already run `supabase login`, and this repository has been linked with
`supabase link`.

## Safe production workflow

From the repository root, always preview the migration set first:

```zsh
supabase db push --dry-run
```

Review the full list. It must contain the intended new migration(s) only. If
older migrations appear unexpectedly, stop before making any database change:
the remote migration history needs reconciliation. Do not use
`supabase db reset --linked` on production; it is destructive.

When the preview is correct, apply it:

```zsh
supabase db push
```

Then run the migration-specific verification queries and deploy the compatible
application release when one is required.

## Pooler or passwordless-login failure

The CLI may connect through Supabase's pooler using a temporary login role. A
failure such as `cli_login_postgres`, `Connection terminated unexpectedly`, or
a pooler connection timeout can be a local network/VPN issue rather than a bad
migration.

1. Disconnect any corporate VPN or proxy, or try a personal network, then retry
   the dry run once.
2. Supply the project **database password** only for the current terminal
   session. It is not an anon key, service-role key, or personal access token:

   ```zsh
   read -s "SUPABASE_DB_PASSWORD?Supabase database password: "
   echo
   export SUPABASE_DB_PASSWORD

   supabase db push --dry-run
   ```

3. If the preview is correct, run `supabase db push` in that same terminal, then
   clear the session secret:

   ```zsh
   unset SUPABASE_DB_PASSWORD
   ```

Never add `SUPABASE_DB_PASSWORD` to `.zshrc`, `.zprofile`, `.env`, Railway, a
shell command line, or source control. Do not paste it into chat. For an
unattended CI migration, store it in that CI provider's secret store and inject
it only for the migration command.

If the timeout remains after changing networks and using the database password,
inspect Supabase Database network restrictions and network bans before retrying
repeatedly. The documented pooler-bypass fallback requires IPv6 and the beta
CLI; use it only after checking the official current troubleshooting guidance.

## Change handoff checklist

- Confirm the exact migration filename shown by `--dry-run`.
- Apply with `supabase db push`; never use a remote reset for this workflow.
- Record migration-specific verification results without copying secrets.
- State whether a Railway deploy/redeploy is required by related app or
  environment-variable changes.

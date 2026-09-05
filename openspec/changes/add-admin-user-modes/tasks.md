## 1. Persist application roles

- [x] 1.1 Add an idempotent Supabase migration for a `profiles` role record, owner-only profile RLS, default `user` role, new-account creation trigger, and existing-account backfill; verify the migration leaves every auth user with exactly one profile and does not grant cross-user journal access.
- [x] 1.2 Add application role types and browser-profile lookup to the authentication context; verify session restoration waits for role resolution and profile lookup failure fails closed to the normal-user UI.
- [x] 1.3 Document the operator-only Supabase promotion procedure without example real emails or secrets; verify it promotes a designated existing profile from `user` to `admin` and does not require an app deployment.

## 2. Resolve role-aware defaults and capabilities

- [x] 2.1 Add a role-aware capability/default resolver for available views, model, provider, and contextual-memory behavior; verify a normal account with stale Test, model, or provider localStorage values falls back safely to Quiet, Gemini 3.1 Pro Preview, and Midjourney/Discord.
- [x] 2.2 Update view-density persistence and the control so normal users receive Quiet/Insights only, first use Quiet, and admins retain Quiet/Insights/Test when the existing Test configuration allows it; verify accessible labels and stored-preference recovery.
- [x] 2.3 Update model selection so only admins can select models in Insights/Test and normal-user requests always use Gemini 3.1 Pro Preview; verify the existing administrator options continue to work.
- [x] 2.4 Update provider selection so only enabled administrator Test/Debug shows provider and Dual controls, while normal-user generation and regeneration submit no override and use Midjourney/Discord; verify Midjourney failure stays user-safe and never invokes implicit fallback.
- [x] 2.5 Update normal-user analysis/save behavior to skip contextual-memory selection and post-save inference entirely; verify the normal-user memory context is empty and admins retain existing memory experiments.

## 3. Render the role-aware application shell

- [x] 3.1 Pass the resolved role/capabilities through the page and header controls; verify normal users retain journal entry, analysis, images, history, regeneration, deletion, analyst selection, Quiet/Insights, and palette selection while admin-only controls are absent.
- [x] 3.2 Keep model selection in administrator Insights/Test and provider, mock, memory experiment, diagnostics, reset, and rebuild surfaces in administrator Test/Debug only; verify the administrator workflow remains usable across fresh and historical analyses.
- [x] 3.3 Preserve the floating all-user palette picker and ensure first-use/invalid-storage fallback remains Inkwell; verify selections remain browser-local and auth pages retain the picker.
- [x] 3.4 Update normal-user loading, metadata, and error presentation so Quiet/Insights remain understandable without diagnostics; verify normal users receive a retryable Midjourney failure summary rather than provider internals.

## 4. Cover migrations and behavior with tests

- [x] 4.1 Add focused tests for role/profile parsing, capability resolution, stored-preference fallback, and Inkwell palette fallback; verify normal and admin expectation matrices pass.
- [x] 4.2 Update component tests for role-aware view controls, model/provider visibility, memory experiment visibility, and normal-user defaults; verify stale browser selections cannot reappear in normal UI.
- [x] 4.3 Update action and memory tests to prove normal-user flows do not select, persist, or update contextual memory, and administrator flows preserve current behavior.
- [x] 4.4 Add or document migration verification covering profile creation/backfill, own-profile read access, role immutability from the browser, and retained analyses/memory RLS isolation.

## 5. Prepare the friends trial

- [x] 5.1 Update user-facing/developer documentation to distinguish the normal-user and administrator experiences, record the agreed defaults, and state that server-side role enforcement is deferred; verify no email addresses, tokens, or secrets are included.
- [x] 5.2 Update `app/.env.example` and deployment documentation only as needed to require `IMAGE_GENERATION_PROVIDER=midjourney` for normal-user production; verify Railway variable guidance names affected variables but never includes secret values.
- [x] 5.3 Run `cd app && npm run lint`, the relevant Vitest suites, `npm run build`, and `npm run check:lockfile-registry`; verify a manual normal-user and administrator smoke test covers analysis, Midjourney failure/retry behavior, history, palette selection, and role-specific controls.
- [ ] 5.4 Before production testing, promote the owner-supplied accounts through Supabase, review Railway production variable changes, and deploy/redeploy; verify an administrator and a normal user each see the intended experience.

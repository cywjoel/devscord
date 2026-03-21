# Devscord - Discord Bot with GitHub Integration (WIP)

## Project Objective

A Discord bot that brings GitHub workflow directly into your engineering team's Discord server. The bot enables seamless issue and pull request management through Discord commands, with real-time synchronization between GitHub and Discord threads.

**Key Goals:**
- Link one GitHub organization per Discord server
- Authenticate individual users to their GitHub accounts
- Create dedicated channels for repositories with thread-per-issue/PR synchronization
- Enable engineers to execute GitHub actions (assign, comment, close, label) directly from Discord

---

## Project Roadmap

### Phase 1: Foundation ✅ COMPLETE

- [x] GitHub App registration
- [x] Database schema + Supabase setup
  - [x] `DB_IMPL.md` created with full schema specification
  - [x] Migration file: `supabase/migrations/001_phase1_foundation.sql`
  - [x] Migration file: `supabase/migrations/002_fix_device_flow_sessions_fk.sql` (removed FK constraint)
  - [x] Tables: `users`, `orgs`, `github_app_installations`, `device_flow_sessions`
- [x] Supabase client library integration
  - [x] Installed `@supabase/supabase-js`
  - [x] Created `src/supabase/` module with repository pattern
  - [x] Type-safe CRUD operations for all Phase 1 tables
  - [x] Repositories: `UserRepository`, `OrgRepository`, `InstallationRepository`, `DeviceFlowRepository`
- [x] OAuth Device Flow (`/link-github`)
  - [x] Discord command handler (`src/discord/commands/auth/link-github.ts`)
  - [x] GitHub Device Flow API integration
  - [x] Polling logic with error handling
  - [x] Token storage after authorization
- [x] Token encryption (AES-256-GCM)
  - [x] Created `src/auth/encryption.ts` with encrypt/decrypt functions
  - [x] Token validation module (`src/auth/token-validator.ts`)
  - [x] 21 tests (all passing)
  - [x] Updated `link-github.ts` to encrypt tokens before storing

**Phase 1 Progress: 100% complete** ✅

**Notes on Token Refresh**:
- OAuth App tokens (used for user authentication) **do not expire** — no refresh needed
- GitHub App tokens (for bot API calls) expire in 1 hour — refresh needed in Phase 2+
- Token refresh moved to Phase 2 (GitHub App integration)

---

### Phase 2: Repo Linking + GitHub App Integration

- [ ] GitHub App installation flow
  - [ ] Install GitHub App on organization
  - [ ] Store installation ID in `github_app_installations` table
  - [ ] Exchange installation token (expires in 1 hour)
  - [ ] **Token refresh logic for GitHub App tokens** ⬅️ Moved from Phase 1
- [ ] `/link-repo` command
  - [ ] Validate repo exists and user has admin access
  - [ ] Create `#repo-issues` and `#repo-prs` channels
  - [ ] Store channel mappings in `repos` table
- [ ] `/unlink-repo` command
  - [ ] Delete channels (optional, configurable)
  - [ ] Mark repo as inactive
- [ ] Permission sync
  - [ ] Check user has access to linked repo
  - [ ] Cache permissions in `user_repo_permissions` table
- [ ] Rate limit tracking
  - [ ] Track GitHub API rate limits per installation
  - [ ] Store in `rate_limit_state` table

---

### Phase 3: Issue Commands

- [ ] Thread-per-issue sync (webhook → Discord)
  - [ ] GitHub webhook handler (`github/webhooks`)
  - [ ] Create Discord thread when issue opened
  - [ ] Store mapping in `issue_threads` table
  - [ ] Webhook delivery tracking (`webhook_deliveries` table)
- [ ] `/assign-user` command
  - [ ] Decrypt user token
  - [ ] Call GitHub API to assign user
  - [ ] Handle token revocation gracefully
- [ ] `/unassign-user` command
- [ ] `/close-issue` command
  - [ ] Support "complete" and "not-planned" reasons
- [ ] `/add-comment` command
  - [ ] Modal for comment input
- [ ] `/add-label` and `/remove-label` commands
  - [ ] Label autocomplete/suggestions

---

### Phase 4: PR Integration

- [ ] PR thread sync (webhook → Discord)
- [ ] PR comment commands
- [ ] Review commands (future)
  - [ ] `/approve`
  - [ ] `/request-changes`
  - [ ] `/comment-review`

---

### Phase 5: Polish

- [ ] Error notifications
  - [ ] Discord webhook for critical errors
  - [ ] User-friendly error messages
- [ ] Health monitoring
  - [ ] Rate limit alerts
  - [ ] Token expiry warnings (GitHub App tokens)
  - [ ] Webhook delivery failures
- [ ] Admin dashboard commands
  - [ ] `/stats` — Show usage statistics
  - [ ] `/linked-repos` — List all linked repos
  - [ ] `/linked-users` — List all linked users
- [ ] Command usage logging
  - [ ] Store in `command_usage_logs` table
  - [ ] Analytics and debugging

---

## Environment Variables (subject to change)

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID from Discord Developer Portal |
| `GITHUB_APP_ID` | GitHub App ID from `github.com/settings/apps` |
| `GITHUB_APP_PRIVATE_KEY` | Private key (PEM) for GitHub App JWT signing |
| `GITHUB_CLIENT_ID` | OAuth Client ID for user authentication |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret for user authentication |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |

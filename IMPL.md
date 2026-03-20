# Implementation Plan

## Overview

Discord bot with GitHub integration for engineering teams. One GitHub organization per Discord server, with user authentication and repo-channel linking.

---

## Authentication Architecture

### GitHub App (Recommended)

| Aspect | Recommendation |
|--------|----------------|
| **App Type** | GitHub App (not OAuth App) |
| **Why** | Fine-grained permissions, short-lived tokens, user controls repo access |
| **Registration** | Create at `github.com/settings/apps` |

### User Classes

```
┌─────────────────────────────────────────────────────────────┐
│  Class 1: Server Owner (Admin)                              │
│  - Links the GitHub Organization to Discord server          │
│  - Manages repo-channel mappings                            │
│  - Requires: admin OAuth token                              │
├─────────────────────────────────────────────────────────────┤
│  Class 2: Linked Users (Engineers)                          │
│  - Discord account ↔ GitHub account mapping                 │
│  - Can execute issue/PR commands in linked repo channels    │
│  - Requires: user OAuth token with repo scope               │
├─────────────────────────────────────────────────────────────┤
│  Class 3: Unlinked Users (Read-only)                        │
│  - Can view channels but cannot execute commands            │
│  - No GitHub token stored                                   │
└─────────────────────────────────────────────────────────────┘
```

### OAuth Flow (for user linking)

1. User runs `/link github` in Discord
2. Bot responds with device code + verification URL (Device Flow for headless apps)
3. User visits URL, enters code, authorizes on GitHub
4. Bot polls for token, stores `discord_id ↔ github_id + tokens` in database
5. Tokens refreshed automatically (GitHub App tokens are short-lived)

### Required Scopes/Permissions

| Permission | Why |
|------------|-----|
| `issues: read` | Read issues, comments, labels |
| `issues: write` | Assign, comment, close, label |
| `contents: read` | Read repository metadata |
| `pull_requests: read` | Read PRs |
| `pull_requests: write` | Comment on PRs (future) |

---

## Module Breakdown

| # | Module | Responsibility |
|---|--------|----------------|
| 1 | `auth/github-app` | GitHub App registration, JWT signing for app-level auth |
| 2 | `auth/oauth-flow` | OAuth Device Flow implementation, token exchange |
| 3 | `auth/token-store` | Secure token storage, refresh logic, encryption |
| 4 | `db/schema` | Database tables: users, orgs, repos, channels, mappings |
| 5 | `db/user-mapping` | Discord ↔ GitHub user mapping CRUD |
| 6 | `db/repo-registry` | Linked repos, channel IDs, org association |
| 7 | `github/client` | Octokit wrapper, token injection, rate limit handling |
| 8 | `github/issues` | Issue operations: assign, comment, close, label |
| 9 | `github/pull-requests` | PR operations: list, comment, review (future) |
| 10 | `github/repos` | Repository metadata, webhook registration |
| 11 | `github/webhooks` | GitHub webhook handler (issue opened, PR created, etc.) |
| 12 | `discord/channels` | Channel creation, deletion, permission sync |
| 13 | `discord/threads` | Thread management per issue/PR |
| 14 | `discord/commands/issues` | `/assign`, `/unassign`, `/comment`, `/close`, `/label` |
| 15 | `discord/commands/repos` | `/link repo`, `/unlink repo` |
| 16 | `discord/commands/admin` | Server owner commands (TBD) |
| 17 | `discord/modals` | Modal handlers for `/comment`, `/label add/remove` |
| 18 | `permissions/checker` | Verify user has linked GitHub account + repo access |
| 19 | `sync/github-to-discord` | Webhook → Discord message synchronization |
| 20 | `health/monitor` | Rate limit tracking, token expiry alerts, error logging |

---

## Database Schema (Supabase)

```
users
├── discord_id (PK)
├── github_id
├── github_username
├── access_token (encrypted)
├── refresh_token (encrypted)
└── token_expires_at

orgs
├── id (PK)
├── discord_guild_id
├── github_org_name
└── admin_discord_id

repos
├── id (PK)
├── org_id (FK)
├── github_repo_name
├── issues_channel_id
├── pr_channel_id
└── is_active

issue_threads
├── discord_thread_id (PK)
├── repo_id (FK)
├── github_issue_number
└── last_synced_at
```

---

## Command Structure

### Issue Thread Commands (require linked GitHub account)

| Command | Modal? | GitHub API Call |
|---------|--------|-----------------|
| `/assign <user>` | No | `POST /repos/{owner}/{repo}/issues/{n}/assignees` |
| `/unassign <user>` | No | `DELETE /repos/{owner}/{repo}/issues/{n}/assignees` |
| `/comment` | Yes | `POST /repos/{owner}/{repo}/issues/{n}/comments` |
| `/close complete` | No | `PATCH /repos/{owner}/{repo}/issues/{n}` (`state: closed, state_reason: completed`) |
| `/close not-planned` | No | `PATCH` (`state: closed, state_reason: not_planned`) |
| `/label add` | Yes (dropdown) | `POST /repos/{owner}/{repo}/issues/{n}/labels` |
| `/label remove` | Yes (dropdown) | `DELETE /repos/{owner}/{repo}/issues/{n}/labels/{name}` |

### Repo Commands (admin only)

| Command | Action |
|---------|--------|
| `/link repo <org/repo>` | Creates `#repo-issues`, `#repo-prs`, stores channel IDs |
| `/unlink repo <org/repo>` | Deletes channels, marks repo inactive |

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] GitHub App registration
- [x] Database schema + Supabase setup
  - [x] `DB_IMPL.md` created with full schema specification
  - [x] Migration file: `supabase/migrations/001_phase1_foundation.sql`
  - [x] Tables: `users`, `orgs`, `github_app_installations`, `device_flow_sessions`
  - [x] Migration file: `supabase/migrations/002_fix_device_flow_sessions_fk.sql` (removed FK constraint)
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

## Key Decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| GitHub App or OAuth App? | **Hybrid** | OAuth App for user auth (Device Flow), GitHub App for bot API calls |
| Device Flow or Web Flow? | Device Flow | Discord is headless; no browser redirect |
| Database? | Supabase | Fits the user-mapping requirement |
| Webhook or Polling? | Webhooks | Real-time sync (GitHub → Discord) |
| Token Encryption? | AES-256-GCM | Encrypt tokens before storing in database |
| Token Refresh? | Phase 2 | OAuth App tokens don't expire; GitHub App tokens need refresh |

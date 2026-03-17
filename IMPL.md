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

### Phase 1: Foundation

- [ ] GitHub App registration
- [ ] Database schema + Supabase setup
- [ ] OAuth Device Flow (`/link github`)
- [ ] Token storage + refresh

### Phase 2: Repo Linking

- [ ] `/link repo`, `/unlink repo` commands
- [ ] Channel creation/deletion
- [ ] Permission sync

### Phase 3: Issue Commands

- [ ] Thread-per-issue sync (webhook → Discord)
- [ ] `/assign`, `/unassign`, `/close`
- [ ] `/comment modal`
- [ ] `/label modals`

### Phase 4: PR Integration

- [ ] PR thread sync
- [ ] PR comment commands
- [ ] Review commands (future)

### Phase 5: Polish

- [ ] Rate limit handling
- [ ] Error notifications
- [ ] Admin dashboard commands
- [ ] Health monitoring

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| GitHub App or OAuth App? | GitHub App (recommended by docs, better security) |
| Device Flow or Web Flow? | Device Flow (Discord is headless; no browser redirect) |
| Database? | Supabase (fits the user-mapping requirement) |
| Webhook or Polling? | Webhooks for real-time sync (GitHub → Discord) |

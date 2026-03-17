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
- [ ] `/comment` modal
- [ ] `/label` modals

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

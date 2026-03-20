-- Migration: 001_phase1_foundation
-- Description: Creates Phase 1 tables: users, orgs, github_app_installations, device_flow_sessions
-- Created: 2026-03-17

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS ====================

CREATE TABLE IF NOT EXISTS users (
    -- Primary key: Discord user ID
    discord_id TEXT PRIMARY KEY,

    -- GitHub account mapping
    github_id TEXT,
    github_username TEXT,

    -- OAuth tokens (encrypt at application layer)
    access_token TEXT,
    refresh_token TEXT,

    -- Token lifecycle
    token_expires_at TIMESTAMPTZ,

    -- Metadata
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    last_token_refresh TIMESTAMPTZ,
    scopes_granted TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_github_username ON users(github_username);
CREATE INDEX IF NOT EXISTS idx_users_token_expires_at ON users(token_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(linked_at);

-- ==================== ORGS ====================

CREATE TABLE IF NOT EXISTS orgs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- Discord server identifier
    discord_guild_id TEXT UNIQUE NOT NULL,

    -- GitHub organization
    github_org_name TEXT NOT NULL,
    github_org_id BIGINT NOT NULL,

    -- Server owner (references users.discord_id)
    admin_discord_id TEXT NOT NULL REFERENCES users(discord_id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orgs
CREATE INDEX IF NOT EXISTS idx_orgs_discord_guild_id ON orgs(discord_guild_id);
CREATE INDEX IF NOT EXISTS idx_orgs_github_org_id ON orgs(github_org_id);

-- ==================== GITHUB APP INSTALLATIONS ====================

CREATE TABLE IF NOT EXISTS github_app_installations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- GitHub's installation ID (unique)
    github_installation_id BIGINT UNIQUE NOT NULL,

    -- Link to orgs table
    org_id BIGINT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

    -- GitHub org ID (denormalized)
    github_org_id BIGINT NOT NULL,

    -- Installation state
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for installations
CREATE INDEX IF NOT EXISTS idx_installations_org_id ON github_app_installations(org_id);
CREATE INDEX IF NOT EXISTS idx_installations_github_org_id ON github_app_installations(github_org_id);

-- ==================== DEVICE FLOW SESSIONS ====================

CREATE TABLE IF NOT EXISTS device_flow_sessions (
    -- GitHub's device code
    device_code TEXT PRIMARY KEY,

    -- Discord user initiating the flow
    -- NOTE: No FK constraint to users table - user may not exist yet
    discord_id TEXT NOT NULL,

    -- User code (shown to user)
    user_code TEXT UNIQUE NOT NULL,

    -- Verification URI
    verification_uri TEXT NOT NULL,

    -- Polling state
    expires_at TIMESTAMPTZ NOT NULL,
    interval_seconds INTEGER NOT NULL DEFAULT 5,
    authorized BOOLEAN NOT NULL DEFAULT FALSE,

    -- Tokens (populated after authorization)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for device flow sessions
CREATE INDEX IF NOT EXISTS idx_device_flow_discord_id ON device_flow_sessions(discord_id);
CREATE INDEX IF NOT EXISTS idx_device_flow_expires_at ON device_flow_sessions(expires_at);

-- ==================== HELPER FUNCTIONS ====================

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orgs_updated_at
    BEFORE UPDATE ON orgs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER github_app_installations_updated_at
    BEFORE UPDATE ON github_app_installations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== COMMENTS ====================

COMMENT ON TABLE users IS 'Maps Discord accounts to GitHub accounts with OAuth tokens';
COMMENT ON COLUMN users.discord_id IS 'Discord user ID (primary key)';
COMMENT ON COLUMN users.github_id IS 'GitHub user ID (from OAuth response)';
COMMENT ON COLUMN users.github_username IS 'GitHub username (from OAuth response)';
COMMENT ON COLUMN users.access_token IS 'GitHub OAuth access token (encrypted at app layer)';
COMMENT ON COLUMN users.refresh_token IS 'GitHub OAuth refresh token (encrypted at app layer)';
COMMENT ON COLUMN users.token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN users.linked_at IS 'Timestamp when OAuth Device Flow completed';
COMMENT ON COLUMN users.last_token_refresh IS 'Timestamp of last successful token refresh';
COMMENT ON COLUMN users.scopes_granted IS 'OAuth scopes granted by user (e.g. issues:read, repo)';

COMMENT ON TABLE orgs IS 'Links Discord servers to GitHub organizations';
COMMENT ON TABLE github_app_installations IS 'Tracks GitHub App installations per organization';
COMMENT ON TABLE device_flow_sessions IS 'Temporary storage for OAuth Device Flow sessions';

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS (policies should be configured based on your needs)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_app_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_flow_sessions ENABLE ROW LEVEL SECURITY;

-- Service role policy (backend access)
CREATE POLICY service_role_full_access ON users
    FOR ALL
    USING (true);

CREATE POLICY service_role_full_access ON orgs
    FOR ALL
    USING (true);

CREATE POLICY service_role_full_access ON github_app_installations
    FOR ALL
    USING (true);

CREATE POLICY service_role_full_access ON device_flow_sessions
    FOR ALL
    USING (true);

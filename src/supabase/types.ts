/**
 * Database type definitions
 * These types should match your Supabase schema
 */

// ==================== Users ====================

export interface User {
  discord_id: string;
  github_id: string | null;
  github_username: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  linked_at: string | null;
  last_token_refresh: string | null;
  scopes_granted: string[];
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  discord_id: string;
  github_id?: string | null;
  github_username?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  linked_at?: string | null;
  last_token_refresh?: string | null;
  scopes_granted?: string[];
}

export interface UserUpdate {
  github_id?: string | null;
  github_username?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  linked_at?: string | null;
  last_token_refresh?: string | null;
  scopes_granted?: string[];
}

// ==================== Organizations ====================

export interface Org {
  id: number;
  discord_guild_id: string;
  github_org_name: string;
  github_org_id: number;
  admin_discord_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrgInsert {
  discord_guild_id: string;
  github_org_name: string;
  github_org_id: number;
  admin_discord_id: string;
}

export interface OrgUpdate {
  github_org_name?: string;
  github_org_id?: number;
  admin_discord_id?: string;
}

// ==================== GitHub App Installations ====================

export interface GitHubAppInstallation {
  id: number;
  github_installation_id: number;
  org_id: number;
  github_org_id: number;
  installed_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubAppInstallationInsert {
  github_installation_id: number;
  org_id: number;
  github_org_id: number;
}

export interface GitHubAppInstallationUpdate {
  suspended_at?: string | null;
  suspended_reason?: string | null;
}

// ==================== Device Flow Sessions ====================

export interface DeviceFlowSession {
  device_code: string;
  discord_id: string;
  user_code: string;
  verification_uri: string;
  expires_at: string;
  interval_seconds: number;
  authorized: boolean;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface DeviceFlowSessionInsert {
  device_code: string;
  discord_id: string;
  user_code: string;
  verification_uri: string;
  expires_at: string;
  interval_seconds?: number;
  authorized?: boolean;
}

export interface DeviceFlowSessionUpdate {
  authorized?: boolean;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
}

// ==================== Query Result Types ====================

/**
 * Standardized result type for repository operations
 */
export interface RepositoryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Standardized result type for list operations
 */
export interface RepositoryListResult<T> {
  data: T[];
  error: Error | null;
}

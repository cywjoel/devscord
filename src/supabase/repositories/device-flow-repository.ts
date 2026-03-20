import { supabase } from "../client";
import type {
  DeviceFlowSession,
  DeviceFlowSessionInsert,
  DeviceFlowSessionUpdate,
  RepositoryResult,
} from "../types";

export class DeviceFlowRepository {
  /**
   * Find a device flow session by device code
   */
  async findByDeviceCode(
    deviceCode: string,
  ): Promise<RepositoryResult<DeviceFlowSession>> {
    try {
      const { data, error } = await supabase
        .from("device_flow_sessions")
        .select("*")
        .eq("device_code", deviceCode)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find a device flow session by user code
   */
  async findByUserCode(
    userCode: string,
  ): Promise<RepositoryResult<DeviceFlowSession>> {
    try {
      const { data, error } = await supabase
        .from("device_flow_sessions")
        .select("*")
        .eq("user_code", userCode)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find all pending sessions for a Discord user
   */
  async findPendingByDiscordId(
    discordId: string,
  ): Promise<RepositoryResult<DeviceFlowSession[]>> {
    try {
      const { data, error } = await supabase
        .from("device_flow_sessions")
        .select("*")
        .eq("discord_id", discordId)
        .eq("authorized", false)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Create a new device flow session
   */
  async create(
    sessionData: DeviceFlowSessionInsert,
  ): Promise<RepositoryResult<DeviceFlowSession>> {
    try {
      const { data, error } = await supabase
        .from("device_flow_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Update a device flow session by device code
   */
  async update(
    deviceCode: string,
    sessionData: DeviceFlowSessionUpdate,
  ): Promise<RepositoryResult<DeviceFlowSession>> {
    try {
      const { data, error } = await supabase
        .from("device_flow_sessions")
        .update(sessionData)
        .eq("device_code", deviceCode)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Mark a session as authorized with tokens
   */
  async markAuthorized(
    deviceCode: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiresAt: string,
  ): Promise<RepositoryResult<DeviceFlowSession>> {
    return this.update(deviceCode, {
      authorized: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
    });
  }

  /**
   * Delete a device flow session by device code
   */
  async delete(deviceCode: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from("device_flow_sessions")
        .delete()
        .eq("device_code", deviceCode);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Delete expired sessions (cleanup job)
   *
   * @returns Number of deleted sessions (if count is available)
   */
  async deleteExpired(): Promise<RepositoryResult<number>> {
    try {
      // First, count expired sessions
      const { count, error: countError } = await supabase
        .from("device_flow_sessions")
        .select("device_code", { count: "exact", head: true })
        .lt("expires_at", new Date().toISOString());

      if (countError) throw countError;

      // Then delete them
      const { error: deleteError } = await supabase
        .from("device_flow_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString());

      if (deleteError) throw deleteError;

      // Return count of deleted sessions
      return { data: count ?? 0, error: null };
    } catch (err) {
      return { data: 0, error: err as Error };
    }
  }

  /**
   * Check if a session is expired
   */
  async isExpired(deviceCode: string): Promise<boolean> {
    const result = await this.findByDeviceCode(deviceCode);
    if (!result.data) return true;

    return new Date(result.data.expires_at) < new Date();
  }

  /**
   * Check if a session is authorized
   */
  async isAuthorized(deviceCode: string): Promise<boolean> {
    const result = await this.findByDeviceCode(deviceCode);
    return result.data?.authorized === true;
  }
}

// Export singleton instance for convenience
export const deviceFlowRepository = new DeviceFlowRepository();

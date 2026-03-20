import { supabase } from "../client";
import type {
  User,
  UserInsert,
  UserUpdate,
  RepositoryResult,
  RepositoryListResult,
} from "../types";
import { decryptToken } from "../../auth/encryption";

export class UserRepository {
  /**
   * Find a user by Discord ID
   */
  async findByDiscordId(discordId: string): Promise<RepositoryResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("discord_id", discordId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find a user by GitHub ID
   */
  async findByGithubId(githubId: string): Promise<RepositoryResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("github_id", githubId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find a user by GitHub username
   */
  async findByGithubUsername(
    username: string,
  ): Promise<RepositoryResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("github_username", username)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Create a new user
   */
  async create(userData: UserInsert): Promise<RepositoryResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Update a user by Discord ID
   */
  async update(
    discordId: string,
    userData: UserUpdate,
  ): Promise<RepositoryResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("discord_id", discordId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Upsert a user (create or update)
   */
  async upsert(userData: UserInsert): Promise<RepositoryResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(userData, { onConflict: "discord_id" })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Delete a user by Discord ID
   */
  async delete(discordId: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("discord_id", discordId);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get all linked users (users with GitHub accounts)
   */
  async getLinkedUsers(): Promise<RepositoryListResult<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .not("github_id", "is", null);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err as Error };
    }
  }

  /**
   * Check if a user has a linked GitHub account
   */
  async isLinked(discordId: string): Promise<boolean> {
    const result = await this.findByDiscordId(discordId);
    return result.data !== null && result.data.github_id !== null;
  }

  /**
   * Get a user's decrypted GitHub access token
   *
   * @returns The decrypted token, or null if user doesn't exist or has no token
   * @throws Error if token decryption fails
   */
  async getDecryptedToken(discordId: string): Promise<string | null> {
    const result = await this.findByDiscordId(discordId);
    if (!result.data || !result.data.access_token) {
      return null;
    }

    return decryptToken(result.data.access_token);
  }

  /**
   * Get a user with their decrypted access token
   *
   * @returns User object with decrypted token, or null if user doesn't exist
   */
  async getUserWithDecryptedToken(
    discordId: string,
  ): Promise<(User & { decrypted_access_token: string }) | null> {
    const result = await this.findByDiscordId(discordId);
    if (!result.data || !result.data.access_token) {
      return null;
    }

    const decryptedToken = decryptToken(result.data.access_token);

    return {
      ...result.data,
      decrypted_access_token: decryptedToken,
    };
  }
}

// Export singleton instance for convenience
export const userRepository = new UserRepository();

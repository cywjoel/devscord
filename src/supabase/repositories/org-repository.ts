import { supabase } from "../client";
import type {
  Org,
  OrgInsert,
  OrgUpdate,
  RepositoryResult,
  RepositoryListResult,
} from "../types";

export class OrgRepository {
  /**
   * Find an organization by Discord guild ID
   */
  async findByDiscordGuildId(
    discordGuildId: string
  ): Promise<RepositoryResult<Org>> {
    try {
      const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("discord_guild_id", discordGuildId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find an organization by GitHub organization ID
   */
  async findByGithubOrgId(githubOrgId: number): Promise<RepositoryResult<Org>> {
    try {
      const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("github_org_id", githubOrgId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find an organization by internal ID
   */
  async findById(id: number): Promise<RepositoryResult<Org>> {
    try {
      const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Create a new organization
   */
  async create(orgData: OrgInsert): Promise<RepositoryResult<Org>> {
    try {
      const { data, error } = await supabase
        .from("orgs")
        .insert(orgData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Update an organization by ID
   */
  async update(id: number, orgData: OrgUpdate): Promise<RepositoryResult<Org>> {
    try {
      const { data, error } = await supabase
        .from("orgs")
        .update(orgData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Delete an organization by ID
   */
  async delete(id: number): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase.from("orgs").delete().eq("id", id);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get all organizations for a Discord guild
   */
  async getByDiscordGuildId(
    discordGuildId: string
  ): Promise<RepositoryListResult<Org>> {
    try {
      const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("discord_guild_id", discordGuildId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err as Error };
    }
  }

  /**
   * Check if a Discord guild has a linked GitHub organization
   */
  async isLinked(discordGuildId: string): Promise<boolean> {
    const result = await this.findByDiscordGuildId(discordGuildId);
    return result.data !== null;
  }
}

// Export singleton instance for convenience
export const orgRepository = new OrgRepository();

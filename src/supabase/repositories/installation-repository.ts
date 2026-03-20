import { supabase } from "../client";
import type {
  GitHubAppInstallation,
  GitHubAppInstallationInsert,
  GitHubAppInstallationUpdate,
  RepositoryResult,
  RepositoryListResult,
} from "../types";

export class InstallationRepository {
  /**
   * Find an installation by GitHub installation ID
   */
  async findByGithubInstallationId(
    githubInstallationId: number
  ): Promise<RepositoryResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
        .select("*")
        .eq("github_installation_id", githubInstallationId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find an installation by organization ID
   */
  async findByOrgId(orgId: number): Promise<RepositoryResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
        .select("*")
        .eq("org_id", orgId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Find an installation by GitHub organization ID
   */
  async findByGithubOrgId(
    githubOrgId: number
  ): Promise<RepositoryResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
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
   * Create a new installation
   */
  async create(
    installationData: GitHubAppInstallationInsert
  ): Promise<RepositoryResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
        .insert(installationData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Update an installation by GitHub installation ID
   */
  async update(
    githubInstallationId: number,
    installationData: GitHubAppInstallationUpdate
  ): Promise<RepositoryResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
        .update(installationData)
        .eq("github_installation_id", githubInstallationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Mark an installation as suspended
   */
  async markSuspended(
    githubInstallationId: number,
    reason?: string
  ): Promise<RepositoryResult<GitHubAppInstallation>> {
    return this.update(githubInstallationId, {
      suspended_at: new Date().toISOString(),
      suspended_reason: reason || null,
    });
  }

  /**
   * Mark an installation as active (unsuspend)
   */
  async markActive(
    githubInstallationId: number
  ): Promise<RepositoryResult<GitHubAppInstallation>> {
    return this.update(githubInstallationId, {
      suspended_at: null,
      suspended_reason: null,
    });
  }

  /**
   * Delete an installation by GitHub installation ID
   */
  async delete(githubInstallationId: number): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from("github_app_installations")
        .delete()
        .eq("github_installation_id", githubInstallationId);

      if (error) throw error;
      return { data: undefined, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get all installations for an organization
   */
  async getByOrgId(
    orgId: number
  ): Promise<RepositoryListResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
        .select("*")
        .eq("org_id", orgId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err as Error };
    }
  }

  /**
   * Check if an installation is suspended
   */
  async isSuspended(githubInstallationId: number): Promise<boolean> {
    const result = await this.findByGithubInstallationId(githubInstallationId);
    return result.data !== null && result.data.suspended_at !== null;
  }

  /**
   * Get all active (non-suspended) installations
   */
  async getActiveInstallations(): Promise<RepositoryListResult<GitHubAppInstallation>> {
    try {
      const { data, error } = await supabase
        .from("github_app_installations")
        .select("*")
        .is("suspended_at", null);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err as Error };
    }
  }
}

// Export singleton instance for convenience
export const installationRepository = new InstallationRepository();

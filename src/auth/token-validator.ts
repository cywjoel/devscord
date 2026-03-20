import { Octokit } from "octokit";
import { decryptToken } from "./encryption";

/**
 * GitHub user information returned after token validation
 */
export interface GitHubUserInfo {
  login: string;
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  user?: GitHubUserInfo;
}

/**
 * Validates a GitHub OAuth token by making a test API call
 *
 * @param encryptedToken - The encrypted token from the database
 * @returns Validation result with user info if valid
 *
 * @example
 * ```typescript
 * const result = await validateToken(encryptedToken);
 * if (result.valid) {
 *   console.log("Token valid for user:", result.user?.login);
 * } else {
 *   console.log("Token invalid:", result.error);
 * }
 * ```
 */
export async function validateToken(
  encryptedToken: string,
): Promise<TokenValidationResult> {
  try {
    // Decrypt the token
    const token = decryptToken(encryptedToken);

    // Create Octokit instance with the token
    const octokit = new Octokit({ auth: token });

    // Test the token by fetching user info
    const { data: user } = await octokit.rest.users.getAuthenticated();

    return {
      valid: true,
      user: {
        login: user.login,
        id: user.id,
        email: user.email ?? null,
        name: user.name ?? null,
        avatar_url: user.avatar_url,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific GitHub API errors
      if ("status" in error && error.status === 401) {
        return {
          valid: false,
          error: "Token has been revoked by the user",
        };
      }

      if ("status" in error && error.status === 403) {
        return {
          valid: false,
          error: "Token lacks required permissions",
        };
      }

      return {
        valid: false,
        error: `Validation failed: ${error.message}`,
      };
    }

    return {
      valid: false,
      error: "Unknown validation error",
    };
  }
}

/**
 * Gets GitHub user information using an encrypted token
 *
 * @param encryptedToken - The encrypted token from the database
 * @returns User info if successful, null if token is invalid
 *
 * @example
 * ```typescript
 * const user = await getGithubUser(encryptedToken);
 * if (user) {
 *   console.log("GitHub user:", user.login);
 * }
 * ```
 */
export async function getGithubUser(
  encryptedToken: string,
): Promise<GitHubUserInfo | null> {
  const result = await validateToken(encryptedToken);
  return result.user ?? null;
}

/**
 * Checks if a token has the required scopes
 *
 * @param encryptedToken - The encrypted token from the database
 * @param requiredScopes - Array of required scopes (e.g., ['repo', 'read:user'])
 * @returns True if all required scopes are present
 *
 * @example
 * ```typescript
 * const hasAccess = await checkTokenScopes(encryptedToken, ['repo', 'read:user']);
 * if (hasAccess) {
 *   // Proceed with API call
 * }
 * ```
 */
export async function checkTokenScopes(
  encryptedToken: string,
  requiredScopes: string[],
): Promise<boolean> {
  try {
    const token = decryptToken(encryptedToken);
    const octokit = new Octokit({ auth: token });

    // For OAuth Apps, we can test scopes by attempting API calls
    // Try to access user repos (requires 'repo' or 'public_repo' scope)
    if (requiredScopes.includes("repo")) {
      await octokit.rest.repos.listForAuthenticatedUser();
    }

    // Try to read user email (requires 'read:user' or 'user:email' scope)
    if (requiredScopes.includes("read:user")) {
      await octokit.rest.users.getAuthenticated();
    }

    return true;
  } catch (error) {
    // If any scope check fails, the token lacks required permissions
    return false;
  }
}

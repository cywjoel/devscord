import { describe, it, expect, beforeEach } from "bun:test";
import { encryptToken } from "../encryption";
import { validateToken, getGithubUser, checkTokenScopes } from "../token-validator";

describe("Token Validator", () => {
  // Mock tokens for testing
  const validToken = "gho_test1234567890abcdefghijklmnopqrstuvwxyz";
  const invalidToken = "gho_invalid_token_12345";

  describe("validateToken", () => {
    it("should return invalid for fake test tokens", async () => {
      // Since we're using fake tokens, validation should fail
      const encrypted = encryptToken(validToken);
      const result = await validateToken(encrypted);

      // Fake tokens will fail GitHub API validation
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle decryption errors gracefully", async () => {
      const result = await validateToken("invalid-encrypted-token");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return user info for valid tokens (integration)", async () => {
      // This test would pass with a real GitHub token
      // Skipping in CI/CD environment
      const shouldSkip = !process.env.TEST_GITHUB_TOKEN;
      if (shouldSkip) {
        console.log("Skipping: TEST_GITHUB_TOKEN not set");
        return;
      }

      const encrypted = encryptToken(process.env.TEST_GITHUB_TOKEN!);
      const result = await validateToken(encrypted);

      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.login).toBeDefined();
    });
  });

  describe("getGithubUser", () => {
    it("should return null for invalid tokens", async () => {
      const encrypted = encryptToken(invalidToken);
      const user = await getGithubUser(encrypted);

      expect(user).toBeNull();
    });

    it("should return null for malformed tokens", async () => {
      const user = await getGithubUser("not-a-valid-token");

      expect(user).toBeNull();
    });

    it("should return user info for valid tokens (integration)", async () => {
      const shouldSkip = !process.env.TEST_GITHUB_TOKEN;
      if (shouldSkip) {
        console.log("Skipping: TEST_GITHUB_TOKEN not set");
        return;
      }

      const encrypted = encryptToken(process.env.TEST_GITHUB_TOKEN!);
      const user = await getGithubUser(encrypted);

      expect(user).not.toBeNull();
      expect(user?.login).toBeDefined();
    });
  });

  describe("checkTokenScopes", () => {
    it("should return false for invalid tokens", async () => {
      const encrypted = encryptToken(invalidToken);
      const hasScopes = await checkTokenScopes(encrypted, ["repo"]);

      expect(hasScopes).toBe(false);
    });

    it("should return false for malformed tokens", async () => {
      const hasScopes = await checkTokenScopes("invalid-token", ["repo"]);

      expect(hasScopes).toBe(false);
    });

    it("should check for repo scope (integration)", async () => {
      const shouldSkip = !process.env.TEST_GITHUB_TOKEN;
      if (shouldSkip) {
        console.log("Skipping: TEST_GITHUB_TOKEN not set");
        return;
      }

      const encrypted = encryptToken(process.env.TEST_GITHUB_TOKEN!);
      const hasRepoScope = await checkTokenScopes(encrypted, ["repo"]);

      // Result depends on the actual token's scopes
      expect(typeof hasRepoScope).toBe("boolean");
    });
  });
});

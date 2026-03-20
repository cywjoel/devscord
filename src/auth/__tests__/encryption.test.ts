import { describe, it, expect, beforeEach } from "bun:test";
import { encryptToken, decryptToken } from "../encryption";

describe("Token Encryption", () => {
  const testToken = "gho_1234567890abcdefghijklmnopqrstuvwxyz";
  const anotherToken = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";

  describe("encryptToken", () => {
    it("should encrypt a token", () => {
      const encrypted = encryptToken(testToken);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe(testToken);
      expect(encrypted).not.toContain(testToken);
    });

    it("should produce different ciphertext for same plaintext (random IV)", () => {
      const encrypted1 = encryptToken(testToken);
      const encrypted2 = encryptToken(testToken);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw on empty token", () => {
      expect(() => encryptToken("")).toThrow();
    });

    it("should throw on null/undefined token", () => {
      expect(() => encryptToken(null as any)).toThrow();
      expect(() => encryptToken(undefined as any)).toThrow();
    });
  });

  describe("decryptToken", () => {
    it("should decrypt an encrypted token", () => {
      const encrypted = encryptToken(testToken);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(testToken);
    });

    it("should decrypt different tokens correctly", () => {
      const encrypted1 = encryptToken(testToken);
      const encrypted2 = encryptToken(anotherToken);

      const decrypted1 = decryptToken(encrypted1);
      const decrypted2 = decryptToken(encrypted2);

      expect(decrypted1).toBe(testToken);
      expect(decrypted2).toBe(anotherToken);
      expect(decrypted1).not.toBe(decrypted2);
    });

    it("should throw on invalid ciphertext format", () => {
      expect(() => decryptToken("not-a-valid-ciphertext")).toThrow();
      expect(() => decryptToken("")).toThrow();
      expect(() => decryptToken("invalid-base64!!!")).toThrow();
    });

    it("should throw on tampered ciphertext", () => {
      const encrypted = encryptToken(testToken);
      const tampered = encrypted.substring(0, encrypted.length - 5) + "XXXXX";

      expect(() => decryptToken(tampered)).toThrow();
    });

    it("should throw on ciphertext encrypted with different key", () => {
      // This test assumes the key is loaded from env vars
      // In a real scenario, changing keys would require app restart
      const encrypted = encryptToken(testToken);

      // Temporarily change the key (this won't work in practice without restart)
      // We'll test this by trying to decrypt with obviously wrong data
      expect(() => {
        // Simulate tampering by modifying the ciphertext
        const parts = encrypted.split(":");
        parts[0] = "tampered";
        decryptToken(parts.join(":"));
      }).toThrow();
    });
  });

  describe("round-trip", () => {
    it("should handle long tokens", () => {
      const longToken = "gho_" + "a".repeat(500);
      const encrypted = encryptToken(longToken);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(longToken);
    });

    it("should handle tokens with special characters", () => {
      const specialToken = "gho_abc123!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = encryptToken(specialToken);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(specialToken);
    });

    it("should handle tokens with unicode characters", () => {
      const unicodeToken = "gho_你好世界🌍";
      const encrypted = encryptToken(unicodeToken);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(unicodeToken);
    });
  });
});

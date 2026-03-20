import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Validate encryption key on module load
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    "TOKEN_ENCRYPTION_KEY environment variable is not set. " +
      "Generate one with: openssl rand -hex 32",
  );
}

// Validate key length (must be 32 bytes / 64 hex characters for AES-256)
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
if (keyBuffer.length !== 32) {
  throw new Error(
    `TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters), got ${keyBuffer.length} bytes. ` +
      "Generate a valid key with: openssl rand -hex 32",
  );
}

// AES-256-GCM configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM
const ENCODING = "base64";

/**
 * Encrypts a GitHub OAuth token using AES-256-GCM
 *
 * @param token - The plain text token to encrypt
 * @returns Base64-encoded ciphertext in format: iv:authTag:ciphertext
 *
 * @example
 * ```typescript
 * const encrypted = encryptToken("gho_abc123...");
 * // Returns: "dG9rZW4=:YXV0aFRhZw==:ZW5jcnlwdGVkRGF0YQ=="
 * ```
 */
export function encryptToken(token: string): string {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }

  // Generate random IV (initialization vector)
  const iv = randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt the token
  let encrypted = cipher.update(token, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  // Combine IV, auth tag, and ciphertext
  // Format: iv:authTag:ciphertext (all base64 encoded)
  const combined = [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted,
  ].join(":");

  return combined;
}

/**
 * Decrypts an encrypted GitHub OAuth token
 *
 * @param encrypted - The base64-encoded ciphertext in format: iv:authTag:ciphertext
 * @returns The decrypted plain text token
 *
 * @throws Error if the ciphertext is invalid, tampered, or encrypted with a different key
 *
 * @example
 * ```typescript
 * const decrypted = decryptToken("dG9rZW4=:YXV0aFRhZw==:ZW5jcnlwdGVkRGF0YQ==");
 * // Returns: "gho_abc123..."
 * ```
 */
export function decryptToken(encrypted: string): string {
  if (!encrypted || typeof encrypted !== "string") {
    throw new Error("Encrypted token must be a non-empty string");
  }

  // Split the combined string
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted token format. Expected format: iv:authTag:ciphertext",
    );
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;

  // Convert IV and auth tag back to buffers
  const iv = Buffer.from(ivBase64 as string, ENCODING);
  const authTag = Buffer.from(authTagBase64 as string, ENCODING);

  // Validate lengths
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      `Invalid auth tag length. Expected ${AUTH_TAG_LENGTH} bytes`,
    );
  }

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set the auth tag
  decipher.setAuthTag(authTag);

  // Decrypt the token
  let decrypted = decipher.update(ciphertext as string, ENCODING, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Validates that a token is properly encrypted
 *
 * @param encrypted - The encrypted token to validate
 * @returns true if the token format is valid (does not verify decryption)
 */
export function isValidEncryptedFormat(encrypted: string): boolean {
  try {
    if (!encrypted || typeof encrypted !== "string") {
      return false;
    }

    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      return false;
    }

    const [ivBase64, authTagBase64] = parts;

    // Validate base64 encoding
    const iv = Buffer.from(ivBase64 as string, ENCODING);
    const authTag = Buffer.from(authTagBase64 as string, ENCODING);

    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

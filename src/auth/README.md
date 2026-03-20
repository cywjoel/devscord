# Authentication Module

Token encryption and validation for GitHub OAuth tokens.

---

## Setup

### 1. Generate Encryption Key

Before using the bot, generate a 32-byte encryption key:

```bash
openssl rand -hex 32
```

### 2. Add to Environment

Add the key to your `.env.dev` file:

```bash
TOKEN_ENCRYPTION_KEY=84fed8366ecc981a2744395b7667294cfb9ad62f2ab907e839127290a743a96d
```

**Important**: 
- Key must be exactly 32 bytes (64 hex characters)
- Keep this key secret and secure
- If lost, all stored tokens become unrecoverable
- If compromised, all users must re-authenticate

---

## Usage

### Encrypt Token (on OAuth completion)

```typescript
import { encryptToken } from "../auth/encryption";

const plainToken = "gho_abc123...";
const encrypted = encryptToken(plainToken);

// Store `encrypted` in database
await userRepository.upsert({
  discord_id: "123",
  access_token: encrypted,
  // ...
});
```

### Decrypt Token (before API calls)

```typescript
import { decryptToken } from "../auth/encryption";

// Get encrypted token from database
const { data: user } = await userRepository.findByDiscordId("123");
const encrypted = user?.access_token;

// Decrypt for use
const plainToken = decryptToken(encrypted);

// Use with Octokit
const octokit = new Octokit({ auth: plainToken });
```

### Validate Token (optional health check)

```typescript
import { validateToken } from "../auth/token-validator";

const result = await validateToken(encryptedToken);

if (result.valid) {
  console.log("Token valid for user:", result.user?.login);
} else {
  console.log("Token invalid:", result.error);
  // Prompt user to re-authenticate
}
```

---

## API Reference

### `encryptToken(token: string): string`

Encrypts a GitHub OAuth token using AES-256-GCM.

**Returns**: Base64-encoded ciphertext in format `iv:authTag:ciphertext`

**Throws**: Error if token is empty or invalid

---

### `decryptToken(encrypted: string): string`

Decrypts an encrypted GitHub OAuth token.

**Returns**: Plain text token

**Throws**: Error if ciphertext is invalid, tampered, or encrypted with wrong key

---

### `isValidEncryptedFormat(encrypted: string): boolean`

Validates that a token has the correct encrypted format (does not verify decryption).

**Returns**: `true` if format is valid

---

### `validateToken(encryptedToken: string): Promise<TokenValidationResult>`

Validates a GitHub OAuth token by making a test API call to GitHub.

**Returns**: 
```typescript
{
  valid: boolean;
  error?: string;
  user?: {
    login: string;
    id: number;
    email: string | null;
    name: string | null;
    avatar_url: string;
  };
}
```

---

### `getGithubUser(encryptedToken: string): Promise<GitHubUserInfo | null>`

Gets GitHub user information using an encrypted token.

**Returns**: User info if successful, `null` if token is invalid

---

### `checkTokenScopes(encryptedToken: string, requiredScopes: string[]): Promise<boolean>`

Checks if a token has the required scopes by attempting API calls.

**Returns**: `true` if all required scopes are present

**Example**:
```typescript
const hasRepoAccess = await checkTokenScopes(encryptedToken, ["repo"]);
const hasUserAccess = await checkTokenScopes(encryptedToken, ["read:user"]);
```

---

## Security Notes

### Token Storage

- ✅ All tokens are encrypted with AES-256-GCM before storing in database
- ✅ Each encryption uses a random IV (different ciphertext for same token)
- ✅ Authentication tag prevents tampering
- ✅ Key stored in environment variable (not in code/database)

### What Gets Encrypted

| Field | Encrypt? | Why |
|-------|----------|-----|
| `access_token` | ✅ Yes | Bearer token - full repo access |
| `refresh_token` | ✅ Yes (if used) | Can generate new access tokens |
| `github_id` | ❌ No | Public identifier |
| `github_username` | ❌ No | Public information |
| `scopes_granted` | ❌ No | Metadata, not sensitive |

### Key Management

**Development**:
- Store in `.env.dev`
- Add `.env.dev` to `.gitignore`
- Generate unique key per developer

**Production**:
- Use secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Inject via environment variable
- Rotate keys periodically (requires user re-authentication)

### If Key Is Compromised

1. Generate new key immediately
2. Deploy with new key
3. All existing tokens become unreadable
4. Users must run `/link-github` again

### If Database Is Compromised

- Tokens are encrypted (useless without encryption key)
- Attacker cannot decrypt without `TOKEN_ENCRYPTION_KEY`
- No immediate action required (but rotate key as precaution)

---

## Testing

### Run Tests

```bash
bun test src/auth/__tests__/*.test.ts --env-file=.env.test
```

### Test Coverage

- ✅ Encryption/decryption round-trip
- ✅ Different ciphertext for same plaintext (random IV)
- ✅ Tamper detection (auth tag validation)
- ✅ Invalid format handling
- ✅ Long tokens, special characters, unicode
- ✅ Token validation with GitHub API (integration)

---

## Troubleshooting

### Error: "TOKEN_ENCRYPTION_KEY environment variable is not set"

**Solution**: Generate key and add to `.env.dev`:
```bash
openssl rand -hex 32
```

### Error: "TOKEN_ENCRYPTION_KEY must be 32 bytes"

**Solution**: Key is wrong length. Generate new key:
```bash
openssl rand -hex 32
```

### Error: "Invalid encrypted token format"

**Cause**: Token in database is corrupted or not encrypted

**Solution**: Check if token starts with base64 (no `gho_` prefix). If plain text, user must re-authenticate.

### Error: "Token has been revoked by the user"

**Cause**: User disconnected the OAuth app from GitHub settings

**Solution**: Prompt user to run `/link-github` again

---

## File Structure

```
src/auth/
├── index.ts                 # Barrel exports
├── encryption.ts            # AES-256-GCM encrypt/decrypt
├── token-validator.ts       # Validate tokens with GitHub API
└── __tests__/
    ├── encryption.test.ts   # 12 tests for encryption
    └── token-validator.test.ts  # 9 tests for validation
```

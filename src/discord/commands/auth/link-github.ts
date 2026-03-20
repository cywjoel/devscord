import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { deviceFlowRepository, userRepository } from "../../../supabase";
import { encryptToken } from "../../../auth/encryption";

export const data = new SlashCommandBuilder()
  .setName("link-github")
  .setDescription("Link your Discord account to your GitHub account")
  .setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands);

export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer the reply (ephemeral - only visible to the user)
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;

  try {
    // Step 1: Check if user is already linked
    const { data: existingUser } =
      await userRepository.findByDiscordId(discordId);
    const isAlreadyLinked = existingUser?.github_id !== null;

    // Step 2: Request device code from GitHub
    // Note: This requires GITHUB_CLIENT_ID to be set in .env
    const deviceCodeResponse = await requestDeviceCode();

    if (!deviceCodeResponse) {
      await interaction.editReply({
        content:
          "❌ Failed to initiate GitHub authentication. Please try again later.",
      });
      return;
    }

    // Step 3: Store the device flow session in database
    // Use the user_code from GitHub (not a generated one!)
    const { error: insertError } = await deviceFlowRepository.create({
      device_code: deviceCodeResponse.device_code,
      discord_id: discordId,
      user_code: deviceCodeResponse.user_code,
      verification_uri: deviceCodeResponse.verification_uri,
      expires_at: deviceCodeResponse.expires_at,
      interval_seconds: deviceCodeResponse.interval,
      authorized: false,
    });

    if (insertError) {
      console.error("Failed to store device flow session:", insertError);
      await interaction.editReply({
        content:
          "❌ Failed to initialize authentication session. Please try again later.",
      });
      return;
    }

    // Step 4: Send instructions to user
    if (isAlreadyLinked) {
      // User is already linked - show warning
      await interaction.editReply({
        content:
          `⚠️ **Already Linked**\n\n` +
          `You're currently linked as **${existingUser?.github_username}**.\n\n` +
          `Continuing will **replace** your existing link. This is useful if you want to:\n` +
          `• Switch to a different GitHub account\n` +
          `• Re-authorize with additional permissions\n` +
          `• Fix "token revoked" errors\n\n` +
          `**Continue?** Visit the URL below:\n\n` +
          `1. Visit: **${deviceCodeResponse.verification_uri}**\n` +
          `2. Enter this code: **\`${deviceCodeResponse.user_code}\`**\n` +
          `3. Authorize the application on GitHub\n\n` +
          `⏳ This code expires <t:${Math.floor(Date.parse(deviceCodeResponse.expires_at) / 1000)}:R>.\n\n` +
          `Once you've authorized, I'll automatically detect it and update your link!`,
      });
    } else {
      // First-time link
      await interaction.editReply({
        content:
          `**Link Your GitHub Account**\n\n` +
          `1. Visit: **${deviceCodeResponse.verification_uri}**\n` +
          `2. Enter this code: **\`${deviceCodeResponse.user_code}\`**\n` +
          `3. Authorize the application on GitHub\n\n` +
          `⏳ This code expires <t:${Math.floor(Date.parse(deviceCodeResponse.expires_at) / 1000)}:R>.\n\n` +
          `Once you've authorized, I'll automatically detect it and link your account!`,
      });
    }

    // Step 5: Start polling for token
    pollForToken(
      deviceCodeResponse.device_code,
      deviceCodeResponse.interval * 1000,
      discordId,
      interaction,
    );
  } catch (error) {
    console.error("Error in /link-github command:", error);
    await interaction.editReply({
      content:
        "❌ An unexpected error occurred. Please try again later.\n" +
        `\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``,
    });
  }
}

/**
 * Request a device code from GitHub OAuth Device Flow
 */
async function requestDeviceCode(): Promise<{
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  expires_at: string;
  interval: number;
} | null> {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error("GITHUB_OAUTH_CLIENT_ID environment variable is not set");
  }

  const response = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      // OAuth App scopes (different from GitHub App permissions)
      // 'repo' includes: repo:status, repo_deployment, public_repo, repo:invite
      // 'read:user' includes: user:email, user:follow
      scope: "repo read:user",
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(
      "[GitHub OAuth] Device code request failed:",
      response.status,
      errorData,
    );
    return null;
  }

  const data = await response.json();

  return {
    device_code: data.device_code,
    user_code: data.user_code,
    verification_uri: data.verification_uri,
    expires_in: data.expires_in,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    interval: data.interval,
  };
}

/**
 * Poll GitHub for token until user authorizes or session expires
 */
async function pollForToken(
  deviceCode: string,
  intervalMs: number,
  discordId: string,
  interaction: ChatInputCommandInteraction,
) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "Missing GITHUB_OAUTH_CLIENT_ID or GITHUB_OAUTH_CLIENT_SECRET for polling",
    );
    return;
  }

  const maxAttempts = Math.floor(900000 / intervalMs); // 15 minutes max
  let attempts = 0;

  const poll = async () => {
    attempts++;

    try {
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            device_code: deviceCode,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Success! User authorized
        await handleAuthorization(discordId, deviceCode, data, interaction);
        return;
      }

      if (data.error === "authorization_pending") {
        // User hasn't authorized yet, continue polling
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        } else {
          await interaction.editReply({
            content:
              "⏰ Authentication timed out. Please run `/link-github` again to start a new session.",
          });
          // Clean up expired session
          await deviceFlowRepository.delete(deviceCode);
        }
        return;
      }

      if (data.error === "expired_token") {
        await interaction.editReply({
          content:
            "⏰ The authentication code has expired. Please run `/link-github` again to start a new session.",
        });
        await deviceFlowRepository.delete(deviceCode);
        return;
      }

      if (data.error === "access_denied") {
        await interaction.editReply({
          content:
            "❌ Authentication was denied. Please run `/link-github` again if you'd like to link your account.",
        });
        await deviceFlowRepository.delete(deviceCode);
        return;
      }

      // Unknown error
      console.error("Unknown polling error:", data);
      await interaction.editReply({
        content:
          "❌ An error occurred during authentication. Please try again.",
      });
      await deviceFlowRepository.delete(deviceCode);
    } catch (error) {
      console.error("Error polling for token:", error);
      // Continue polling on network errors
      if (attempts < maxAttempts) {
        setTimeout(poll, intervalMs);
      }
    }
  };

  // Start polling
  setTimeout(poll, intervalMs);
}

/**
 * Get GitHub user info using access token
 *
 * @param accessToken - The OAuth access token from GitHub
 * @returns GitHub user ID and username, or null if request fails
 */
async function getGitHubUserInfo(accessToken: string): Promise<{
  github_id: string;
  github_username: string;
} | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        "[GitHub OAuth] Failed to get user info:",
        response.status,
        errorData,
      );
      return null;
    }

    const user = await response.json();

    return {
      github_id: String(user.id),
      github_username: user.login,
    };
  } catch (error) {
    console.error("[GitHub OAuth] Error fetching user info:", error);
    return null;
  }
}

/**
 * Handle successful authorization - store tokens in database
 */
async function handleAuthorization(
  discordId: string,
  deviceCode: string,
  oauthData: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope: string;
  },
  interaction: ChatInputCommandInteraction,
) {
  // Parse scopes
  const scopes = oauthData.scope ? oauthData.scope.split(" ") : [];

  // Calculate expiry time (OAuth App tokens don't expire, but we store it for consistency)
  const tokenExpiresAt = oauthData.expires_in
    ? new Date(Date.now() + oauthData.expires_in * 1000).toISOString()
    : null;

  // Get GitHub user info using the access token
  const userInfo = await getGitHubUserInfo(oauthData.access_token);

  if (!userInfo) {
    console.error("[GitHub OAuth] Failed to get GitHub user info");
    await interaction.editReply({
      content:
        "❌ Failed to retrieve your GitHub profile. Please try again or contact support.",
    });
    return;
  }

  // Encrypt the access token before storing
  const encryptedToken = encryptToken(oauthData.access_token);

  // Store in users table
  const { error: upsertError } = await userRepository.upsert({
    discord_id: discordId,
    github_id: userInfo.github_id,
    github_username: userInfo.github_username,
    access_token: encryptedToken,
    refresh_token: oauthData.refresh_token || null,
    token_expires_at: tokenExpiresAt,
    scopes_granted: scopes,
    linked_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("Failed to store user tokens:", upsertError);
    await interaction.editReply({
      content:
        "❌ Failed to save your GitHub credentials. Please try again or contact support.",
    });
    return;
  }

  // Clean up device flow session
  await deviceFlowRepository.delete(deviceCode);

  // Success message
  await interaction.editReply({
    content:
      `✅ **Successfully linked!**\n\n` +
      `Your Discord account is now linked to your GitHub account.\n\n` +
      `**Granted permissions:**\n` +
      `${scopes.map((s: string) => `• \`${s}\``).join("\n")}\n\n` +
      `You can now use GitHub commands in linked repository channels!`,
  });
}

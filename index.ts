// Require the necessary discord.js classes
import * as fs from "node:fs";
import * as path from "node:path";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";
import { deviceFlowRepository } from "./src/supabase";

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient: Client<true>) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  // Start cleanup timer for expired device flow sessions
  startCleanupTimer();
});

/**
 * Clean up expired device flow sessions
 */
async function cleanupExpiredSessions() {
  try {
    const result = await deviceFlowRepository.deleteExpired();
    if (result.data && result.data > 0) {
      console.log(
        `[Cleanup] Deleted ${result.data} expired device flow sessions`,
      );
    }
  } catch (error) {
    console.error("[Cleanup] Failed to delete expired sessions:", error);
  }
}

/**
 * Start periodic cleanup timer
 * - Runs immediately on startup
 * - Then runs every hour
 */
function startCleanupTimer() {
  // Clean up immediately on startup
  cleanupExpiredSessions();

  // Then clean up every hour (3600000 ms)
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);

  console.log(
    `[Cleanup] Started device flow session cleanup (every ${CLEANUP_INTERVAL / 1000}s)`,
  );
}

client.commands = new Collection();

const foldersPath = path.join(__dirname, "src", "discord", "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

// Log in to Discord with your client's token
client.login(process.env.APPLICATION_BOT_TOKEN);

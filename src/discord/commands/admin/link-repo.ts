import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("link-repo")
  .setDescription("Link a GitHub repository to this Discord server")
  .addStringOption((option) =>
    option
      .setName("repository")
      .setDescription("GitHub repository in format owner/repo")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 2!",
    ephemeral: true,
  });
}

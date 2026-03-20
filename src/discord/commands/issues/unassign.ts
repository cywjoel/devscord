import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unassign-user")
  .setDescription("Unassign a user from a GitHub issue")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The GitHub user to unassign")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(0);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 3!",
    ephemeral: true,
  });
}

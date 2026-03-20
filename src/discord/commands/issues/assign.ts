import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("assign-user")
  .setDescription("Assign a user to a GitHub issue")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The GitHub user to assign")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(0);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 3!",
    ephemeral: true,
  });
}

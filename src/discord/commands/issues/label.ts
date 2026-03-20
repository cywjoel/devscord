import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("add-label")
  .setDescription("Add a label to a GitHub issue")
  .addStringOption((option) =>
    option
      .setName("label")
      .setDescription("Label name to add")
      .setRequired(true),
  )
  .setDefaultMemberPermissions(0);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 3!",
    ephemeral: true,
  });
}

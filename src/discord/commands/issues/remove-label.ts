import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("remove-label")
  .setDescription("Remove a label from a GitHub issue")
  .addStringOption((option) =>
    option
      .setName("label")
      .setDescription("Label name to remove")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(0);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 3!",
    ephemeral: true,
  });
}

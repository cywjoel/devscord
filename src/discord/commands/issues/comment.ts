import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("add-comment")
  .setDescription("Add a comment to a GitHub issue or PR")
  .addStringOption((option) =>
    option.setName("comment").setDescription("Your comment").setRequired(true),
  )
  .setDefaultMemberPermissions(0);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 3!",
    ephemeral: true,
  });
}

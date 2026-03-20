import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("close-issue")
  .setDescription("Close a GitHub issue")
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for closing")
      .setRequired(true)
      .addChoices(
        { name: "✅ Complete", value: "completed" },
        { name: "❌ Not planned", value: "not_planned" },
      ),
  )
  .setDefaultMemberPermissions(0);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "🚧 This command is under construction.\n\nComing in Phase 3!",
    ephemeral: true,
  });
}

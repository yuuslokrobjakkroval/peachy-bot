const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = class RenameTree extends Command {
  constructor(client) {
    super(client, {
      name: "rename-tree",
      description: {
        content: "Rename your existing tree",
        examples: ["rename-tree"],
        usage: "rename-tree",
      },
      category: "games",
      cooldown: 5,
      permissions: {
        dev: false,
        client: ["SendMessages", "EmbedLinks", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const userId = ctx.author.id;

    if (!ctx.interaction) {
      console.error("No interaction found on ctx!");
      return;
    }

    // Check if user has a tree
    const userTree = await Tree.findOne({ userId });
    if (!userTree) {
      return ctx.sendMessage({
        content: "❌ You don't have a tree yet. Use `/tree` to start one!",
        flags: 64,
      });
    }

    // Create a modal to ask for new tree name
    const modal = new ModalBuilder()
      .setCustomId(`rename-tree-modal-${userId}`)
      .setTitle("Rename Your Tree");

    const nameInput = new TextInputBuilder()
      .setCustomId("newTreeName")
      .setLabel("Enter the new name for your tree")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(32)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(nameInput);
    modal.addComponents(row);

    await ctx.interaction.showModal(modal);
  }
};

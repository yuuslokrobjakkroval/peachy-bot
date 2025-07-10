const { Command } = require("../../structures");
const generateTreeCanvas = require("../../utils/GenerateTreeCanvas");
const {
  getXpNeeded,
  checkWaterCooldown,
  getUserTree,
  buildWaterButton,
  buildTreeEmbed,
  sendNotStartedEmbed,
} = require("../../utils/TreeUtil");

const { AttachmentBuilder } = require("discord.js");

module.exports = class ViewTree extends Command {
  constructor(client) {
    super(client, {
      name: "tree",
      description: {
        content: "View your tree's growth progress.",
        examples: ["tree"],
        usage: "tree",
      },
      category: "games",
      aliases: [],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "EmbedLinks", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const userTree = await getUserTree(ctx.author.id);

      if (!userTree) {
        return sendNotStartedEmbed(client, ctx, color);
      }

      const level = userTree.tree.level;
      const xpNeeded = getXpNeeded(level);

      // Generate the tree progress canvas image
      const buffer = await generateTreeCanvas({
        stage: userTree.tree.stage,
        level,
        xp: userTree.tree.xp,
        xpNeeded,
        coins: userTree.coins,
        upgrades: userTree.upgrades,
      });

      const attachment = new AttachmentBuilder(buffer, { name: "tree.png" });

      const embed = buildTreeEmbed(client, ctx, color, language).setImage(
        "attachment://tree.png"
      );

      return ctx.sendMessage({
        embeds: [embed],
        files: [attachment],
      });
    } catch (err) {
      console.error("ViewTree error:", err);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Error showing tree info.",
        color
      );
    }
  }
};

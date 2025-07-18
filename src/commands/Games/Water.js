const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");

module.exports = class WaterTree extends Command {
  constructor(client) {
    super(client, {
      name: "water",
      description: {
        content: "Water your tree to help it grow!",
        examples: ["water"],
        usage: "water",
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
    if (!ctx.interaction) {
      return ctx.sendMessage(
        "⚠️ This command only works with slash commands right now.",
      );
    }

    const userId = ctx.author.id;
    const userTree = await Tree.findOne({ userId });
    if (!userTree) {
      return ctx.sendMessage({
        content: "❌ You don't have a tree yet. Use `/tree` to start one!",
        flags: 64,
      });
    }

    const now = Date.now();
    const cooldown = 60 * 1000; // 1 minute cooldown
    const last = new Date(userTree.tree.lastWatered).getTime();

    if (now - last < cooldown) {
      const remaining = Math.ceil((cooldown - (now - last)) / 1000);
      return ctx.sendMessage({
        content: `⏳ Please wait **<t:${
          Math.round(Date.now() / 1000) + remaining
        }:R>** before watering again.`,
        flags: 64,
      });
    }

    // Update tree stats
    userTree.tree.height += 1;
    userTree.tree.xp += 10;
    userTree.tree.waterCount += 1;
    userTree.tree.lastWatered = new Date();
    userTree.tree.lastWateredBy = userId;

    await userTree.save();

    return ctx.sendMessage({
      content: `💧 You watered **${userTree.tree.name}**! It is now **${userTree.tree.height} ft** tall.`,
    });
  }
};

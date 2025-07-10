const { Command } = require("../../structures");
const Tree = require("../../schemas/tree");
const globalImage = require("../../utils/Gif");
const globalEmoji = require("../../utils/Emoji");

module.exports = class StartTree extends Command {
  constructor(client) {
    super(client, {
      name: "starttree",
      description: {
        content: "Plant your very own tree.",
        examples: ["starttree"],
        usage: "starttree",
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

  async run(client, ctx, args, color) {
    try {
      const existing = await Tree.findOne({ userId: ctx.author.id });

      if (existing) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setDescription(
                "🌱 You've already planted a tree!\nUse `ptree` or `/tree` to view it."
              ),
          ],
        });
      }

      await Tree.create({
        userId: ctx.author.id,
        tree: {
          xp: 0,
          level: 1,
          stage: "seed",
          lastWatered: 0,
        },
        coins: 0,
        upgrades: {
          fertilizer: false,
          rain: false,
        },
      });

      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.success)
            .setThumbnail(client.utils.emojiToImage(globalEmoji.growTree.seed))
            .setImage(globalImage.growTree)
            .setDescription(
              "🌱 You've planted a tree!\nUse `ptree` or `/tree` to view and water it."
            ),
        ],
      });
    } catch (err) {
      console.error("StartTree Error:", err);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to plant your tree.",
        color
      );
    }
  }
};

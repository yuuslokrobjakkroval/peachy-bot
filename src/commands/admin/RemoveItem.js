const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const moreItems = ShopItems.flatMap((shop) => shop.inventory);
const allItems = moreItems.concat(ImportantItems);
const globalEmoji = require("../../utils/Emoji");

module.exports = class RemoveItem extends Command {
  constructor(client) {
    super(client, {
      name: "removeitem",
      description: {
        content: "",
        examples: ["removeitem peach 2"],
        usage: "removeitem <item> [quantity]",
      },
      category: "admin",
      aliases: ["ri"],
      cooldown: 1,
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        ctx.author;
    if (mention.bot)
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        client.i18n.get(language, "commands", "mention_to_bot"),
        color,
      );

    const itemId = args[1]?.toLowerCase();
    const itemInfo = allItems.find((item) => item.id?.toLowerCase() === itemId);

    if (!itemInfo) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        client.i18n.get(language, "commands", "invalid_item"),
        color,
      );
    }

    let quantity = args[2] || 1;
    if (
      isNaN(quantity) ||
      quantity <= 0 ||
      quantity.toString().includes(".") ||
      quantity.toString().includes(",")
    ) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        client.i18n.get(language, "commands", "invalid_quantity"),
        color,
      );
    }

    const baseQuantity = parseInt(quantity);
    try {
      await Users.updateOne(
        { userId: mention.id, "inventory.id": itemId },
        { $inc: { "inventory.$.quantity": -baseQuantity } },
      );

      await Users.updateOne(
        { userId: mention.id, "inventory.quantity": { $lte: 0 } },
        { $pull: { inventory: { id: itemId } } },
      );
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          `${globalEmoji.result.tick} Removed ${itemInfo.emoji} **x${baseQuantity}** ${itemInfo.id} from ${mention.displayName}'s inventory.`,
        );

      return await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Database Update Error:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "Failed to update inventory.",
        color,
      );
    }
  }
};

const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const moreItems = ShopItems.flatMap((shop) => shop.inventory);
const allItems = moreItems.concat(ImportantItems);
const globalEmoji = require("../../utils/Emoji");

module.exports = class AddItem extends Command {
  constructor(client) {
    super(client, {
      name: "additem",
      description: {
        content: "",
        examples: ["additem peach 2"],
        usage: "additem <item> <quantity>",
      },
      category: "admin",
      aliases: ["ai"],
      cooldown: 1,
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [
        {
          name: "user",
          description: "The Discord user ID of the user.",
          type: 3, // String type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user") || ctx.author // Default to the author if no user is provided
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];

    const userId = typeof mention === "string" ? mention : mention.id;
    const syncUser = await client.users.fetch(userId);

    if (syncUser && syncUser?.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.botTransfer,
        color,
      );
    }

    let userData = await Users.findOne({ userId: syncUser.id });
    if (!userData) {
      userData = new Users({
        userId,
        balance: {
          coin: 0,
          bank: 0,
        },
        inventory: [],
      });
      await userData.save();
    }

    const itemId = args[1]?.toLowerCase();
    const itemInfo = allItems.find((item) => item.id?.toLowerCase() === itemId);

    if (!itemInfo) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.invalidItem.replace("%{itemId}", itemId),
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
        generalMessages.invalidQuantity,
        color,
      );
    }

    const baseQuantity = parseInt(quantity);

    const itemIndex = userData.inventory.findIndex((i) => i.id === itemId);

    if (itemIndex !== -1) {
      await Users.updateOne(
        { userId: userId, "inventory.id": itemId },
        { $inc: { "inventory.$.quantity": baseQuantity } },
      ).exec();
    } else {
      await Users.updateOne(
        { userId: userId },
        {
          $push: {
            inventory: {
              id: itemId,
              name: itemInfo.name,
              quantity: baseQuantity,
            },
          },
        },
      ).exec();
    }

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Added ${itemInfo.emoji} **x${baseQuantity}** ${itemInfo.id} to ${mention}.`,
      );

    return ctx.sendMessage({ embeds: [embed] });
  }
};

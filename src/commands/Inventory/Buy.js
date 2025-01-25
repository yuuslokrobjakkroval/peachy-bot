const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const ShopItems = require("../../assets/inventory/ShopItems");
const inventory = ShopItems.flatMap((shop) => shop.inventory);
const Items = inventory
  .filter((value) => value.price.buy !== 0)
  .sort((a, b) => a.price.buy - b.price.buy);

module.exports = class Buy extends Command {
  constructor(client) {
    super(client, {
      name: "buy",
      description: {
        content: "𝑩𝒖𝒚 𝒂𝒏 𝒊𝒕𝒆𝒎 𝒇𝒓𝒐𝒎 𝒕𝒉𝒆 𝒔𝒉𝒐𝒑.",
        examples: ["buy f01"],
        usage: "buy <itemId>",
      },
      cooldown: 5,
      category: "inventory",
      aliases: [],
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [
        {
          name: "items",
          description: "The item you want to buy.",
          type: 3,
          required: false,
        },
        {
          name: "amount",
          description: "The amount of the item you want to buy.",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const buyMessages = language.locales.get(language.defaultLocale)
      ?.inventoryMessages?.buyMessages;

    // Fetch the user data
    const user = await Users.findOne({ userId: ctx.author.id });

    // Ensure the user has coins
    const { coin, bank } = user.balance;
    if (coin < 1) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.zeroBalance,
        color
      );
    }

    // Get the item ID
    const itemId = ctx.isInteraction
      ? ctx.interaction.options.data[0]?.value.toString().toLowerCase()
      : args[0].toLowerCase();

    // Find the item by ID
    const itemInfo = Items.find((item) => item.id === itemId);

    // If item not found, send error message
    if (!itemInfo) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        buyMessages.invalidItem.replace("%{itemId}", args.join(" ")),
        color
      );
    }

    // Check if the item is a theme and the user already owns it
    if (itemInfo.type === "ring") {
      const ringExists = user.inventory.find(
        (invItem) => invItem.id === itemId
      );
      if (ringExists) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          buyMessages.themeAlreadyOwned
            .replace("{{itemEmote}}", itemInfo.emoji)
            .replace("{{itemName}}", itemInfo.name),
          color
        );
      }
    }

    // Prevent buying items that can't be purchased
    if (itemInfo.price.buy === 0) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        buyMessages.itemCannotBeBought
          .replace("{{itemEmote}}", itemInfo.emoji)
          .replace("{{itemName}}", itemInfo.name),
        color
      );
    }

    // Check if user has enough coins
    if (itemInfo.price.buy > coin) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        buyMessages.notEnoughCoins
          .replace("{{coinEmote}}", emoji.coin)
          .replace("{{neededCoins}}", itemInfo.price.buy - coin)
          .replace("{{itemEmote}}", itemInfo.emoji)
          .replace("{{itemName}}", itemInfo.name),
        color
      );
    }

    // Calculate max amount and handle amount logic
    let maxAmountToBuy = Math.floor(coin / itemInfo.price.buy);
    let amount = ctx.isInteraction
      ? ctx.interaction.options.data[1]?.value || 1
      : args[1] || 1;

    if (
      isNaN(amount) ||
      amount < 1 ||
      amount.toString().includes(".") ||
      amount.toString().includes(",")
    ) {
      const amountMap = { all: coin, half: Math.ceil(coin / 2) };

      if (amount in amountMap) {
        amount = amountMap[amount];
      } else {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.invalidAmount,
          color
        );
      }
    }

    let totalPrice = Math.floor(itemInfo.price.buy * amount);
    let afford = true;

    if (totalPrice > coin) {
      totalPrice = itemInfo.price.buy * maxAmountToBuy;
      amount = maxAmountToBuy;
      afford = false;
    }

    const amountToBuy = parseInt(Math.min(amount, maxAmountToBuy));

    // Success embed with item purchase details
    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        buyMessages.description
          .replace(
            "{{afford}}",
            afford ? buyMessages.success : buyMessages.partial
          )
          .replace("{{itemEmote}}", itemInfo.emoji)
          .replace("{{itemName}}", itemInfo.name)
          .replace("{{coinEmote}}", emoji.coin)
          .replace("{{totalPrice}}", client.utils.formatNumber(totalPrice))
          .replace("{{amountToBuy}}", amountToBuy)
      );

    // Update user's inventory and balance
    const existingItem = user.inventory.find(
      (invItem) => invItem.id.toLowerCase() === itemId
    );

    if (existingItem) {
      await Users.updateOne(
        { userId: ctx.author.id, "inventory.id": itemId },
        {
          $inc: {
            "balance.coin": -totalPrice,
            "inventory.$.quantity": amountToBuy,
          },
          $set: { "balance.bank": bank },
        }
      ).exec();
    } else {
      await Users.updateOne(
        { userId: ctx.author.id },
        {
          $inc: { "balance.coin": -totalPrice },
          $set: { "balance.bank": bank },
          $push: {
            inventory: {
              id: itemId,
              name: itemInfo.name,
              quantity: amountToBuy,
            },
          },
        }
      ).exec();
    }

    // Send the purchase confirmation
    return await ctx.sendMessage({ embeds: [embed] });
  }
};

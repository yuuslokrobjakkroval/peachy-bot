const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class BuyPetFood extends Command {
  constructor(client) {
    super(client, {
      name: "buypetfood",
      description: {
        content: "Buy pet food to feed your pets! Usage: buypetfood <quantity>",
        examples: ["buypetfood 5"],
        usage: "buypetfood <quantity>",
      },
      category: "animals",
      aliases: ["bpf"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "quantity",
          description: "The amount of pet food to buy.",
          type: 4, // Integer
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale
    )?.generalMessages;
    const animalMessages = language.locales.get(
      language.defaultLocale
    )?.animalMessages;

    try {
      // Get user data
      const user = await client.utils.getUser(ctx.author.id);
      if (!user) {
        return client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userNotFound,
          color
        );
      }

      // Get the quantity from the arguments
      const quantity = parseInt(args[0]);
      if (isNaN(quantity) || quantity <= 0) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.buypetfood?.invalidQuantity ||
              "Please specify a valid quantity to buy!"
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Add a maximum purchase limit (e.g., 100 items at a time)
      const maxPurchaseLimit = 100;
      if (quantity > maxPurchaseLimit) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.buypetfood?.exceedLimit?.replace(
              "%{maxLimit}",
              maxPurchaseLimit
            ) ||
              `You can only buy up to **${maxPurchaseLimit}** pet food items at a time!`
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Calculate the cost (10 coins per pet food item)
      const costPerPetFood = 10;
      const totalCost = quantity * costPerPetFood;

      if (user.balance.coin < totalCost) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.buypetfood?.notEnoughCoins
              ?.replace("%{totalCost}", client.utils.formatNumber(totalCost))
              ?.replace(
                "%{balance}",
                client.utils.formatNumber(user.balance.coin)
              ) ||
              `You don’t have enough coins! You need **${client.utils.formatNumber(
                totalCost
              )}** coins, but you only have **${client.utils.formatNumber(
                user.balance.coin
              )}**.`
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Deduct the cost from the user's balance
      user.balance.coin -= totalCost;

      // Add pet food to the user's inventory
      const petFoodItem = user.inventory.find((item) => item.id === "petfood");
      if (petFoodItem) {
        petFoodItem.quantity += quantity;
      } else {
        user.inventory.push({
          id: "petfood",
          quantity: quantity,
        });
      }

      // Increment the user's buyPetFoodCount
      user.buyPetFoodCount = (user.buyPetFoodCount || 0) + 1;

      // Save the user to the database
      await Users.updateOne(
        { userId: user.userId },
        {
          $set: {
            "balance.coin": user.balance.coin,
            inventory: user.inventory,
            buyPetFoodCount: user.buyPetFoodCount,
          },
        }
      );

      // Create an embed to display the result
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          (generalMessages?.title
            ?.replace("%{mainLeft}", emoji.mainLeft)
            ?.replace("%{title}", "BUY PET FOOD")
            ?.replace("%{mainRight}", emoji.mainRight) ||
            "✨ **BUY PET FOOD** ✨") +
            (animalMessages?.buypetfood?.success
              ?.replace("%{quantity}", quantity)
              ?.replace("%{totalCost}", client.utils.formatNumber(totalCost))
              ?.replace(
                "%{balance}",
                client.utils.formatNumber(user.balance.coin)
              ) ||
              `\nYou bought **${quantity}** pet food item(s) for **${client.utils.formatNumber(
                totalCost
              )}** coins!\nYou now have **${client.utils.formatNumber(
                user.balance.coin
              )}** coins.`)
        )
        .setFooter({
          text:
            generalMessages?.requestedBy?.replace(
              "%{username}",
              ctx.author.displayName
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error processing BuyPetFood command:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages?.userFetchError ||
          "An error occurred while fetching user data.",
        color
      );
    }
  }
};

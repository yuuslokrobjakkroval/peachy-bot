const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const petList = require("../../assets/growing/Pet");
const expList = require("../../assets/growing/ExpList");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const AllItems = ShopItems.flatMap((shop) => shop.inventory);

module.exports = class Feed extends Command {
  constructor(client) {
    super(client, {
      name: "feed",
      description: {
        content: "Feed a pet in your zoo to help it grow!",
        examples: ["feed bubbles fp01", "feed bubbles fp03 3"],
        usage: "feed <pet id> <food id> [quantity]",
      },
      category: "animals",
      aliases: ["f"],
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
          name: "pet",
          description: "The ID of the pet to feed (use 'zoo' to see your pets)",
          type: 3, // String
          required: true,
        },
        {
          name: "food",
          description: "The ID of the food to feed your pets",
          type: 3, // String
          required: true,
        },
        {
          name: "quantity",
          description: "Amount of food to feed (default: 1)",
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

      if (!user.zoo || user.zoo.length === 0) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.zoo?.empty ||
              "You don’t have any pets in your zoo yet! Use `catch` to catch an egg."
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Get the pet ID and quantity from arguments
      const petId = ctx.isInteraction
        ? ctx.interaction.options.getString("pet")
        : args[0];
      const foodId = ctx.isInteraction
        ? ctx.interaction.options.getString("food")
        : args[1];
      const quantity = ctx.isInteraction
        ? ctx.interaction.options.getInteger("quantity")
        : args[2] || 1; // Default to 1 if no quantity specified

      if (isNaN(quantity) || quantity < 1) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            "Please provide a valid positive number for quantity!"
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      const petIndex = user.zoo.findIndex((p) => p.id.toLowerCase() === petId);
      if (petIndex === -1) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.feed?.invalidPet ||
              "Please specify a valid pet ID! Use `zoo` to see your pets."
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      const pet = user.zoo[petIndex];
      const petData = petList.find((p) => p.id === pet.id);

      // Check if the pet is already at max level
      if (pet.level >= 10) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.feed?.maxLevel?.replace(
              "%{petName}",
              petData.name
            ) ||
              `Your **${petData.name}** is already at the maximum level (Level 10)! You can sell it with \`sell ${petId}\`.`
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Check if the user has enough food
      const foodItem = user.inventory.find((item) => item.id === foodId);
      const foodInfo = AllItems.find(
        ({ id }) => id.toLowerCase() === foodId.toLowerCase()
      );
      if (!foodItem || foodItem.quantity < quantity) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.feed?.noFood ||
              `You don’t have enough food! You need ${quantity} but have ${
                foodItem?.quantity || 0
              }. Buy more with \`shop\` to buy food for pet.`
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Feed the pet
      foodItem.quantity -= quantity;
      let totalXpGained = 0;

      // Generate random XP between 8-10 for each food unit
      for (let i = 0; i < quantity; i++) {
        const randomXp = Math.floor(Math.random() * 3) + 8; // Random number between 8-10
        totalXpGained += foodInfo.xp + randomXp; // Base XP + random XP
      }

      pet.levelXp += totalXpGained;
      pet.lastXpGain = Date.now();

      // Check for level up
      let leveledUp = false;
      let previousLevel = pet.level;
      for (let level = 1; level <= 10; level++) {
        if (pet.levelXp >= expList[level] && pet.level < level) {
          pet.level = level;
          leveledUp = true;
          if (pet.level === 10) break;
        }
      }

      // Save the user to the database
      await Users.updateOne(
        { userId: user.userId },
        {
          $set: {
            inventory: user.inventory,
            zoo: user.zoo,
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
            ?.replace("%{title}", "FEED")
            ?.replace("%{mainRight}", emoji.mainRight) || "✨ **FEED** ✨") +
            (leveledUp
              ? animalMessages?.feed?.levelUp
                  ?.replace("%{petName}", petData.name)
                  ?.replace("%{level}", pet.level)
                  ?.replace("%{emoji}", petData.emoji[pet.level - 1]) +
                  `\nFed ${quantity} food for ${totalXpGained} EXP!` ||
                `\nYou fed your **${
                  petData.name
                }** ${quantity} food for ${totalXpGained} EXP! It leveled up to Level ${
                  pet.level
                }! ${petData.emoji[pet.level - 1]}`
              : animalMessages?.feed?.success
                  ?.replace("%{petName}", petData.name)
                  ?.replace("%{exp}", pet.levelXp)
                  ?.replace("%{emoji}", petData.emoji[pet.level - 1]) +
                  `\nFed ${foodInfo.emoji} ${quantity} food for ${totalXpGained} EXP!` ||
                `\nYou fed your **${
                  petData.name
                }** ${quantity} food for ${totalXpGained} EXP! Current EXP: ${
                  pet.levelXp
                }. ${petData.emoji[pet.level]}`)
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
      console.error("Error processing Feed command:", error);
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

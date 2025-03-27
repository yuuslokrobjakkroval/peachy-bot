const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const petList = require("../../assets/growing/Pet");
const sellingList = require("../../assets/growing/SellingList").default;

module.exports = class SellPet extends Command {
  constructor(client) {
    super(client, {
      name: "sellpet",
      description: {
        content: "Sell a pet from your zoo for coins! Usage: sellpet <pet id>",
        examples: ["sellpet bubbles"],
        usage: "sellpet <pet id>",
      },
      category: "animals",
      aliases: ["sp"],
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
          description:
            "The ID of the pet to sell (use 'zoo' to see your pets).",
          type: 3, // String (since pet ID is a string like "bubbles")
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

      // Get the pet ID from the arguments
      const petId = args[0].toLowerCase();
      const petIndex = user.zoo.findIndex((p) => p.id.toLowerCase() === petId);
      if (petIndex === -1) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.sellpet?.invalidPet ||
              "Please specify a valid pet ID! Use `zoo` to see your pets."
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      const pet = user.zoo[petIndex];
      const petData = petList.find((p) => p.id === pet.id);

      // Check if the pet is at max level (Level 5)
      if (pet.level < 5) {
        const embed = client
          .embed()
          .setColor(color.danger)
          .setDescription(
            animalMessages?.sellpet?.notMaxLevel?.replace(
              "%{petName}",
              petData.name
            ) ||
              `Your **${petData.name}** needs to be Level > 5 to sell! Keep feeding it.`
          );
        return ctx.sendMessage({ embeds: [embed] });
      }

      // Calculate selling price
      const basePrice = sellingList.levels[pet.level]; // Base price for Level 10
      const multiplier = sellingList.colorMultipliers[petData.name]; // Color multiplier
      const sellPrice = Math.floor(basePrice * multiplier);

      // Send a confirmation message
      const confirmEmbed = client
        .embed()
        .setColor(color.warning)
        .setDescription(
          animalMessages?.sellpet?.confirm
            ?.replace("%{color}", sellingList.nameToColor[petData.name])
            ?.replace("%{petName}", petData.name)
            ?.replace("%{coins}", client.utils.formatNumber(sellPrice)) ||
            `Are you sure you want to sell your ${
              sellingList.nameToColor[petData.name]
            } **${petData.name}** for **${client.utils.formatNumber(
              sellPrice
            )}** coins? Reply with "yes" to confirm.`
        );

      await ctx.sendMessage({ embeds: [confirmEmbed] });

      // Wait for confirmation
      const filter = (response) =>
        response.author.id === ctx.author.id &&
        response.content.toLowerCase() === "yes";
      const collector = ctx.channel.createMessageCollector({
        filter,
        time: 15000,
        max: 1,
      });

      collector.on("collect", async () => {
        // Add coins to the user's balance
        user.balance.coin += sellPrice;

        // Increment the user's sellPetCount
        user.sellPetCount = (user.sellPetCount || 0) + 1;

        // Add the sold pet to the soldPets array
        user.soldPets.push({
          id: pet.id,
          level: pet.level,
          soldAt: new Date(),
        });

        // Remove the pet from the zoo
        user.zoo.splice(petIndex, 1);

        // Save the user to the database
        await Users.updateOne(
          { userId: user.userId },
          {
            $set: {
              "balance.coin": user.balance.coin,
              zoo: user.zoo,
              sellPetCount: user.sellPetCount,
              soldPets: user.soldPets,
            },
          }
        );

        // Create an embed to display the result
        const successEmbed = client
          .embed()
          .setColor(color.main)
          .setDescription(
            (generalMessages?.title
              ?.replace("%{mainLeft}", emoji.mainLeft)
              ?.replace("%{title}", "SELL PET")
              ?.replace("%{mainRight}", emoji.mainRight) ||
              "✨ **SELL PET** ✨") +
              (animalMessages?.sellpet?.success
                ?.replace("%{color}", sellingList.nameToColor[petData.name])
                ?.replace("%{petName}", petData.name)
                ?.replace("%{coins}", client.utils.formatNumber(sellPrice))
                ?.replace(
                  "%{totalCoins}",
                  client.utils.formatNumber(user.balance.coin)
                ) ||
                `\nYou sold your ${sellingList.nameToColor[petData.name]} **${
                  petData.name
                }** for **${client.utils.formatNumber(
                  sellPrice
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

        return ctx.sendMessage({ embeds: [successEmbed] });
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          const timeoutEmbed = client
            .embed()
            .setColor(color.danger)
            .setDescription(
              animalMessages?.sellpet?.timeout ||
                "You did not confirm in time. The sale has been canceled."
            );
          return ctx.sendMessage({ embeds: [timeoutEmbed] });
        }
      });
    } catch (error) {
      console.error("Error processing SellPet command:", error);
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

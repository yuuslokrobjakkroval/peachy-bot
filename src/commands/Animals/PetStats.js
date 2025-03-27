const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const petList = require("../../assets/growing/Pet");
const sellingList = require("../../assets/growing/SellingList");

module.exports = class PetStats extends Command {
  constructor(client) {
    super(client, {
      name: "petstats",
      description: {
        content: "View your pet stats, including sold pets and current pets.",
        examples: ["petstats"],
        usage: "petstats",
      },
      category: "animals",
      aliases: ["ps"],
      cooldown: 5,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [],
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

      // Format the list of sold pets
      const soldPetsList =
        user.soldPets.length > 0
          ? user.soldPets
              .map((soldPet, index) => {
                const petData = petList.find((p) => p.id === soldPet.id);
                const petName = petData ? petData.name : soldPet.id;
                return `**${index + 1}. ${petName}** - Level ${soldPet.level}`;
              })
              .join("\n")
          : "You haven’t sold any pets yet.";

      // Format the list of current pets
      const currentPetsList =
        user.zoo.length > 0
          ? user.zoo
              .map((pet, index) => {
                const petData = petList.find((p) => p.id === pet.id);
                const petName = petData ? petData.name : pet.id;
                const currentEmoji = petData ? petData.emoji[pet.level] : "❓";
                return `**${index + 1}. ${petName}** ${currentEmoji}\nID: \`${
                  pet.id
                }\`\nLevel: ${pet.level}`;
              })
              .join("\n")
          : "You don’t have any pets in your zoo yet! Use `catch` to catch an egg.";

      // Create an embed to display the pet stats
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          (generalMessages?.title
            ?.replace("%{mainLeft}", emoji.mainLeft)
            ?.replace("%{title}", "PET STATS")
            ?.replace("%{mainRight}", emoji.mainRight) ||
            "✨ **PET STATS** ✨") +
            `\n\n**Total Pets Sold:** ${user.sellPetCount || 0}\n\n` +
            `**Sold Pets**\n${soldPetsList}\n\n` +
            `**Current Pets (${user.zoo.length}/10)**\n${currentPetsList}`
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
      console.error("Error processing PetStats command:", error);
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

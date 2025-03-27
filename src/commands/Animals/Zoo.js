const { Command } = require("../../structures/index.js");
const petList = require("../../assets/growing/Pet");
const expList = require("../../assets/growing/ExpList");

module.exports = class Zoo extends Command {
  constructor(client) {
    super(client, {
      name: "zoo",
      description: {
        content: "View the pets in your zoo.",
        examples: ["zoo"],
        usage: "zoo",
      },
      category: "animals",
      aliases: ["z"],
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
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const animalMessages = language.locales.get(language.defaultLocale)?.animalMessages;

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

      // Find the pet with the highest level
      const highestLevelPet = user.zoo.reduce((maxPet, currentPet) => {
        return currentPet.level > maxPet.level ? currentPet : maxPet;
      }, user.zoo[0]); // Start with the first pet as the initial max
      const petInfo = petList.find((p) => p.id === highestLevelPet.id.toLowerCase());

      // Create a description of the user's zoo
      const zooDescription = user.zoo.map((pet, index) => {
          const petData = petList.find((p) => p.id === pet.id);
          const currentEmoji = petData.emoji[pet.level];
          return (
            `**${index + 1}**. ${petData.name} ${currentEmoji}\n` +
            `ID: \`${pet.id}\`\n` +
            `Level: ${pet.level}\n` +
            `EXP: ${pet.levelXp}/${expList[pet.level + 1] || "MAX"}\n`
          );
        })
        .join("\n");

      // Create an embed to display the zoo
      const embed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(highestLevelPet ? client.utils.emojiToImage(petInfo.emoji[highestLevelPet.level]) : ctx.author.displayAvatarURL({ dynamic: true }),)
        .setDescription(
          (generalMessages?.title
            ?.replace("%{mainLeft}", emoji.mainLeft)
            ?.replace("%{title}", "YOUR ZOO")
            ?.replace("%{mainRight}", emoji.mainRight) ||
            "✨ **YOUR ZOO** ✨") +
            `\n**Total Pets: ${user.zoo.length}/10**\n` +
            (user.zoo.length >= 10
              ? animalMessages?.zoo?.full ||
                "Your zoo is full! Sell a pet to catch more.\n"
              : "") +
            zooDescription
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
      console.error("Error processing Zoo command:", error);
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

const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Scare extends Command {
  constructor(client) {
    super(client, {
      name: "scare",
      description: {
        content: "Show off a feeling of being scared!",
        examples: ["scare"],
        usage: "scare",
      },
      category: "emotes",
      aliases: [],
      cooldown: 3,
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
      language.defaultLocale,
    )?.generalMessages;
    const scareMessages = language.locales.get(language.defaultLocale)
      ?.emoteMessages?.scareMessages;
    const errorMessages = scareMessages.errors;

    try {
      // Get random scare emoji
      const scareEmoji = emoji.emotes?.scared || globalEmoji.emotes.scared;
      const randomEmote = client.utils.getRandomElement(scareEmoji);
      const emoteImageUrl = client.utils.emojiToImage(randomEmote);

      // Construct the embed with title moved to the description
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "SCARE") // Use "SCARE" as the title in description
            .replace("%{mainRight}", emoji.mainRight) +
            scareMessages.description.replace(
              "%{user}",
              ctx.author.displayName,
            ), // Replace user in description
        )
        .setImage(emoteImageUrl)
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName,
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      // Send the embed message
      return await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      // Error handling for any unexpected errors
      console.error("Error processing scare command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        errorMessages,
        color,
      ); // Use localized error message
    }
  }
};

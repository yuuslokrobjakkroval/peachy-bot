const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Laugh extends Command {
  constructor(client) {
    super(client, {
      name: "laugh",
      description: {
        content: "Express a feeling of laughter.",
        examples: ["laugh"],
        usage: "laugh",
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
    const laughMessages = language.locales.get(language.defaultLocale)
      ?.emoteMessages?.laughMessages;
    const errorMessages = laughMessages.errors;

    try {
      // Get random laugh emoji
      const laughEmoji = emoji.emotes?.laugh || globalEmoji.emotes.laugh;
      const randomEmoji = client.utils.getRandomElement(laughEmoji);

      // Construct the embed
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "LAUGH")
            .replace("%{mainRight}", emoji.mainRight) +
            laughMessages.description.replace(
              "%{user}",
              ctx.author.displayName,
            ),
        )
        .setImage(client.utils.emojiToImage(randomEmoji))
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
      console.error("An error occurred in the Laugh command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        errorMessages,
        color,
      );
    }
  }
};

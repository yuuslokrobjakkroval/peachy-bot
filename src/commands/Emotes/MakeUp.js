const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Makeup extends Command {
  constructor(client) {
    super(client, {
      name: "makeup",
      description: {
        content: "Show off some makeup!",
        examples: ["makeup"],
        usage: "makeup",
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
    const makeupMessages = language.locales.get(language.defaultLocale)
      ?.emoteMessages?.makeupMessages;
    const errorMessages = makeupMessages.errors;

    try {
      // Get random makeup emoji
      const makeupEmoji = emoji.emotes?.makeUp || globalEmoji.emotes.makeUp;
      const randomEmoji = client.utils.getRandomElement(makeupEmoji);

      // Construct the embed
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "MAKEUP")
            .replace("%{mainRight}", emoji.mainRight) +
            makeupMessages.description.replace(
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
      console.error("An error occurred in the Makeup command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        errorMessages,
        color,
      );
    }
  }
};

const { Command } = require("../../structures");
const Users = require("../../schemas/user");

module.exports = class Position extends Command {
  constructor(client) {
    super(client, {
      name: "position",
      description: {
        content: "Check your current work position.",
        examples: ["position"],
        usage: "position",
      },
      category: "work",
      aliases: ["jobinfo", "checkposition"],
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
    const positionMessages = language.locales.get(language.defaultLocale)?.workMessages?.positionMessages;

    try {
      // Get the user from the database
      const user = await Users.findOne({ userId: ctx.author.id });
      if (!user) {
        return await client.utils.sendErrorMessage(
            client,
            ctx,
            generalMessages.userNotFound,
            color
        );
      }

      // Check the user's work position
      const { position, status } = user.work;

      if (!position || (position && status === "awaiting")) {
        const applyingEmbed = client
            .embed()
            .setColor(color.main)
            .setThumbnail(client.utils.emojiToImage(client.utils.emojiPosition(position)))
            .setDescription(
                generalMessages.title
                    .replace("%{mainLeft}", emoji.mainLeft)
                    .replace("%{title}", "POSITION")
                    .replace("%{mainRight}", emoji.mainRight) +
                positionMessages.applyingJob.replace(
                    "%{position}",
                    client.utils.formatCapitalize(position === "it" ? "IT" : position)
                )
            )
            .setFooter({
              text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName),
              iconURL: ctx.author.displayAvatarURL(),
            });

        return await ctx.sendMessage({ embeds: [applyingEmbed] });
      }

      if (!position || (position && status !== "approved")) {
        return await client.utils.sendErrorMessage(
            client,
            ctx,
            positionMessages.noJob,
            color
        );
      }

      const positionEmbed = client
          .embed()
          .setColor(color.main)
          .setThumbnail(client.utils.emojiToImage(client.utils.emojiPosition(position)))
          .setDescription(
              generalMessages.title
                  .replace("%{mainLeft}", emoji.mainLeft)
                  .replace("%{title}", "POSITION")
                  .replace("%{mainRight}", emoji.mainRight) +
              `You are currently working as a **${position === "it" ? "IT" : position}**.`
          )
          .setFooter({
            text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName),
            iconURL: ctx.author.displayAvatarURL(),
          });

      return await ctx.sendMessage({ embeds: [positionEmbed] });

    } catch (error) {
      console.error('Error in Position command:', error);
      return await client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.internalError || "An error occurred while checking your position.",
          color
      );
    }
  }
};
const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class ResignJob extends Command {
  constructor(client) {
    super(client, {
      name: "resignjob",
      description: {
        content: "Resign from your current job position.",
        examples: ["resignjob"],
        usage: "resignjob",
      },
      category: "work",
      aliases: ["resign", "jobresign"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(
      language.defaultLocale,
    )?.generalMessages;
    const resignJobMessages = language.locales.get(language.defaultLocale)
      ?.workMessages?.resignJobMessages;

    try {
      const user = await Users.findOne({ userId: ctx.author.id });
      if (!user) {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          generalMessages.userNotFound,
          color,
        );
      }

      // Check if the user has a job
      if (user.work.status === "not applied") {
        return await client.utils.sendErrorMessage(
          client,
          ctx,
          resignJobMessages.noJobToResign,
          color,
        );
      }

      // Resign from the job
      user.work.position = "Not yet applied";
      user.work.status = "not applied";
      user.work.applyDate = null;
      user.work.approvedDate = null;

      await user.save();

      // Success embed
      const successEmbed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          client.utils.emojiToImage(
            client.utils.emojiPosition(user.work.position),
          ),
        )
        .setDescription(
          `${generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", "RESIGN JOB")
            .replace("%{mainRight}", emoji.mainRight)}
                    ${resignJobMessages.success.replace(
                      "%{username}",
                      ctx.author.displayName,
                    )}`,
        )
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName,
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return await ctx.sendMessage({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error in ResignJob command:", error);
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        generalMessages.internalError,
        color,
      );
    }
  }
};

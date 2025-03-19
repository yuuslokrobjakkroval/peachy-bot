const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class BanUser extends Command {
  constructor(client) {
    super(client, {
      name: "ban",
      description: {
        content: "Ban a user with a reason.",
        examples: ["ban @user spamming"],
        usage: "ban <user> [reason]",
      },
      category: "admin",
      aliases: ["b"],
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [""],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

    if (args.length < 1) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "Please specify whether to `ban`, and mention a user."
            ),
        ],
      });
    }

    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];

    if (!mention) {
      return client.util.sendErrorMessage(client, ctx, generalMessages.noUserMentioned, color);
    }

    const userId = typeof mention === "string" ? mention : mention.id;
    const syncUser = await client.users.fetch(userId);
    let user = await Users.findOne({ userId: syncUser.id });
    if (!user) {
      user = new Users({
        userId: mention.id,
        verification: {
          isBanned: false,
          banReason: null,
        },
      });
    }

    const { isBanned } = user.verification;
    if (isBanned) {
      return await ctx.sendMessage({
        embeds: [
          client.embed().setColor(color.danger).setDescription(`${mention} is already banned.`),
        ],
      });
    } else {
      const reason = args.slice(2).join(" ") || "No reason provided";
      await Users.updateOne(
        { userId: mention.id },
        {
          $set: {
            "verification.isBanned": true,
            "verification.banReason": reason,
          },
        },
        { upsert: true }
      ).exec();

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(
          `${globalEmoji.option.banner} Banned **${mention}** for: \`${reason}\``
        );

      return await ctx.sendMessage({ embeds: [embed] });
    }
  }
};

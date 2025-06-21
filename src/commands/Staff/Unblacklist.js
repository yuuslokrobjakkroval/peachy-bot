const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class Unblacklist extends Command {
  constructor(client) {
    super(client, {
      name: "unblacklist",
      description: {
        content: "Un-blacklist a user.",
        examples: ["unblacklist @user"],
        usage: "unblacklist <user>",
      },
      category: "staff",
      aliases: ["ubl"],
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
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        args[0];

    if (!mention) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("Please mention a valid user."),
        ],
      });
    }

    const userId = typeof mention === "string" ? mention : mention.id;
    let user = await Users.findOne({ userId });

    if (!user || !user.verification.isBlacklist) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("This user is not blacklisted."),
        ],
      });
    }

    await Users.updateOne(
      { userId },
      { $set: { "verification.isBlacklist": false } },
    ).exec();

    return await ctx.sendMessage({
      embeds: [
        client
          .embed()
          .setColor(color.success)
          .setDescription(
            `${globalEmoji.result.tick} Un-blacklisted Successfully.`,
          ),
      ],
    });
  }
};

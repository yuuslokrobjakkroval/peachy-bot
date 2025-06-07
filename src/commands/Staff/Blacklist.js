const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class Blacklist extends Command {
  constructor(client) {
    super(client, {
      name: "blacklist",
      description: {
        content: "Blacklist a user.",
        examples: ["blacklist @user"],
        usage: "blacklist <user>",
      },
      category: "staff",
      aliases: ["bl"],
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
    if (!user) {
      user = new Users({ userId, verification: { isBlacklist: false } });
    }

    if (typeof mention !== "string" && mention.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "You cannot blacklist a bot.",
        color
      );
    }

    if (user.verification.isBlacklist) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription("This user is already blacklisted."),
        ],
      });
    }

    await Users.updateOne(
      { userId },
      { $set: { "verification.isBlacklist": true } },
      { upsert: true }
    ).exec();

    return await ctx.sendMessage({
      embeds: [
        client
          .embed()
          .setColor(color.main)
          .setDescription(
            `${globalEmoji.result.tick} Blacklisted **Successfully**.`
          ),
      ],
    });
  }
};

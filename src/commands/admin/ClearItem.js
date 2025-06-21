const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalEmoji = require("../../utils/Emoji");

module.exports = class ClearItem extends Command {
  constructor(client) {
    super(client, {
      name: "clearitem",
      description: {
        content: "Clear item from user.",
        examples: ["clearitem @user"],
        usage: "clearitem <user> <amount>",
      },
      category: "admin",
      aliases: ["ci"],
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const user = ctx.isInteraction
      ? ctx.interaction.options.getUser("user") || ctx.author // Default to the author if no user is provided
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[2]) ||
        ctx.member;
    if (user.bot)
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        client.i18n.get(language, "commands", "mention_to_bot"),
        color,
      );

    const embed = client
      .embed()
      .setColor(color.main)
      .setDescription(
        `${globalEmoji.result.tick} Cleared all item in ${user} inventory.`,
      );

    await Users.updateOne(
      { userId: user.id },
      { $set: { inventory: [] } },
    ).exec();

    return await ctx.sendMessage({ embeds: [embed] });
  }
};

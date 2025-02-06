const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class BlacklistUser extends Command {
  constructor(client) {
    super(client, {
      name: "blacklistuser",
      description: {
        content: "Blacklist or un-blacklist a user.",
        examples: [
          "blacklistuser blacklist @user",
          "blacklistuser unblacklist @user",
        ],
        usage: "blacklistuser <blacklist|unblacklist> <user>",
      },
      category: "admin",
      aliases: ["blacklist", "unblacklist", "bl", "ubl"],
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
    if (args.length < 2) {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "Please specify whether to `blacklist` or `unblacklist`, and mention a user."
            ),
        ],
      });
    }

    const action = args[0].toLowerCase(); // 'blacklist' or 'unblacklist'
    const mention = ctx.isInteraction
      ? ctx.interaction.options.getUser("user")
      : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[1]) ||
        args[1];

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
      user = new Users({
        userId: userId,
        verification: { isBlacklist: false },
      });
    }

    const { isBlacklist } = user.verification;

    // Prevent blacklisting or un-blacklisting the bot itself
    if (typeof mention !== "string" && mention.bot) {
      return await client.utils.sendErrorMessage(
        client,
        ctx,
        "You cannot blacklist or unblacklist a bot.",
        color
      );
    }

    // Blacklist Action
    if (action === "blacklist") {
      if (isBlacklist) {
        return await ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription("This user is already blacklisted."),
          ],
        });
      }

      // Update the user's blacklist status
      await Users.updateOne(
        { userId: userId },
        { $set: { "verification.isBlacklist": true } },
        { upsert: true }
      ).exec();

      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(`${emoji.tick} Blacklisted ****Successfully****.`);

      return await ctx.sendMessage({ embeds: [embed] });
    } else if (action === "unblacklist") {
      if (!isBlacklist) {
        return await ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.danger)
              .setDescription("This user is not blacklisted."),
          ],
        });
      }

      // Update the user's blacklist status
      await Users.updateOne(
        { userId: userId },
        { $set: { "verification.isBlacklist": false } }
      ).exec();

      const embed = client
        .embed()
        .setColor(color.success)
        .setDescription(`${emoji.tick} Un-blacklisted ****Successfully****.`);

      return await ctx.sendMessage({ embeds: [embed] });
    } else {
      return await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setDescription(
              "Invalid action. Please use `blacklist` or `unblacklist`."
            ),
        ],
      });
    }
  }
};

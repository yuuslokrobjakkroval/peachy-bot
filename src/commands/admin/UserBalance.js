const { Command } = require("../../structures/index.js");
const Users = require("../../schemas/user");
const globalGif = require("../../utils/Gif");
const globalEmoji = require("../../utils/Emoji");

module.exports = class UserBalance extends Command {
  constructor(client) {
    super(client, {
      name: "userbalance",
      description: {
        content: `'Displays a user's balance'`,
        examples: ["ubal @user"],
        usage: "ubal <@user>",
      },
      category: "admin",
      aliases: ["ubal"],
      cooldown: 1,
      args: true,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [
        {
          name: "user",
          description: "The user you want to check.",
          type: 6,
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    try {
      const generalMessages = language.locales.get(
        language.defaultLocale,
      )?.generalMessages;
      const balanceMessages = language.locales.get(language.defaultLocale)
        ?.economyMessages?.balanceMessages;

      const mention = ctx.isInteraction
        ? ctx.interaction.options.getUser("user")
        : ctx.message.mentions.members.first() ||
          ctx.guild.members.cache.get(args[0]) ||
          args[0];

      let syncUser;
      const userId = typeof mention === "string" ? mention : mention?.id;

      // Validate userId
      if (!userId || !/^\d{17,19}$/.test(userId)) {
        const errorEmbed = client
          .embed()
          .setColor(color.danger || "#FF0000")
          .setDescription("Invalid user ID provided.")
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName,
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          });

        return await ctx.sendMessage({ embeds: [errorEmbed] });
      }

      try {
        syncUser = await client.users.fetch(userId);
      } catch (fetchError) {
        const errorEmbed = client
          .embed()
          .setColor(color.danger || "#FF0000")
          .setDescription("Could not find a user with that ID.")
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName,
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          });

        return await ctx.sendMessage({ embeds: [errorEmbed] });
      }

      const user = await Users.findOne({ userId: syncUser.id });
      if (!user) {
        const errorEmbed = client
          .embed()
          .setColor(color.danger || "#FF0000")
          .setDescription("User not found in the database.")
          .setFooter({
            text:
              generalMessages.requestedBy.replace(
                "%{username}",
                ctx.author.displayName,
              ) || `Requested by ${ctx.author.displayName}`,
            iconURL: ctx.author.displayAvatarURL(),
          });

        return await ctx.sendMessage({ embeds: [errorEmbed] });
      }

      const { coin = 0, bank = 0, credit = 0 } = user.balance;

      const embed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
          globalGif.balanceThumbnail
            ? globalGif.balanceThumbnail
            : client.utils.emojiToImage(emoji.main),
        )
        .setDescription(
          generalMessages.title
            .replace("%{mainLeft}", emoji.mainLeft)
            .replace("%{title}", `${syncUser.displayName} BALANCE`)
            .replace("%{mainRight}", emoji.mainRight) +
            balanceMessages.description
              .replace("%{coinEmote}", emoji.coin)
              .replace("%{coin}", client.utils.formatNumber(coin))
              .replace("%{bankEmote}", emoji.bank)
              .replace("%{bank}", client.utils.formatNumber(bank))
              .replace("%{creditEmote}", globalEmoji.card.apple)
              .replace("%{credit}", client.utils.formatNumber(credit)),
        )
        .setImage(globalGif.balanceBanner)
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName,
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error in user balance command:", error);
      const errorEmbed = client
        .embed()
        .setColor(color.danger || "#FF0000")
        .setDescription("An error occurred while processing your request.")
        .setFooter({
          text:
            generalMessages.requestedBy.replace(
              "%{username}",
              ctx.author.displayName,
            ) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        });

      return await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }
};

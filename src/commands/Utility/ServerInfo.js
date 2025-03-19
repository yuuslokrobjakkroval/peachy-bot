const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");
const verificationLevels = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Very High",
};

module.exports = class ServerInfo extends Command {
  constructor(client) {
    super(client, {
      name: "serverinfo",
      description: {
        content: "Displays information about the server",
        examples: ["serverinfo"],
        usage: "serverinfo",
      },
      category: "utility",
      aliases: ["guildinfo", "server", "sv"],
      cooldown: 3,
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
        language.defaultLocale
    )?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(
          generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    } else {
      await ctx.sendDeferMessage(
          generalMessages.search.replace("%{loading}", globalEmoji.searching)
      );
    }

    const { guild } = ctx;

    // Fetch all members of the guild
    const members = await guild.members.fetch();

    const onlineCount = members.filter(
        (member) => member.presence?.status === "online"
    ).size;
    const idleCount = members.filter(
        (member) => member.presence?.status === "idle"
    ).size;
    const dndCount = members.filter(
        (member) => member.presence?.status === "dnd"
    ).size;
    const offlineCount = members.filter(
        (member) => !member.presence || member.presence?.status === "offline"
    ).size;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Count members offline for 7 days and 30 days
    const offline7Days = members.filter(
        (member) => !member.presence && member.joinedTimestamp < sevenDaysAgo
    ).size;

    const offline30Days = members.filter(
        (member) => !member.presence && member.joinedTimestamp < thirtyDaysAgo
    ).size;

    const embed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(guild.iconURL({ dynamic: true, extension: "png" }))
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "SERVER INFO")
                .replace("%{mainRight}", emoji.mainRight)
        )
        .addFields([
          {
            name: `🆔 ID`,
            value: `${globalEmoji.arrow} **${guild.id}**`,
            inline: false,
          },
          {
            name: `📛 Name`,
            value: ` ${globalEmoji.arrow} **${guild.name}**`,
            inline: false,
          },
          {
            name: `👑 Owner`,
            value: `${globalEmoji.arrow} **<@${guild.ownerId}>**`,
            inline: false,
          },
          {
            name: "🔒 Verification",
            value: `${globalEmoji.arrow} ${
                verificationLevels[guild.verificationLevel]
            }`,
            inline: false,
          },
          {
            name: "📊 Channel",
            value: `Categories ${globalEmoji.arrow} **${
                guild.channels.cache.filter((ch) => ch.type === 4).size
            }**\nText channels ${globalEmoji.arrow} **${
                guild.channels.cache.filter((ch) => ch.type === 0).size
            }**\nVoice channels ${globalEmoji.arrow} **${
                guild.channels.cache.filter((ch) => ch.type === 2).size
            }**`,
            inline: false,
          },
          {
            name: "🧍 Member Status",
            value: `Online ${globalEmoji.arrow} **${onlineCount}** members\nIdle ${globalEmoji.arrow} **${idleCount}** members\nDo Not Disturb ${globalEmoji.arrow} **${dndCount}** members\nOffline ${globalEmoji.arrow} **${offlineCount}** members`,
            inline: false,
          },
          {
            name: "📅 Offline Members",
            value: `7 Days ${globalEmoji.arrow} **${offline7Days}** members\n30 Days ${globalEmoji.arrow} **${offline30Days}** members`,
            inline: false,
          },
          {
            name: "🚀 Boost Info",
            value: `Boosts ${globalEmoji.arrow} **${
                guild.premiumSubscriptionCount || 0
            }**\nBoost level ${globalEmoji.arrow} **${guild.premiumTier}**`,
            inline: false,
          },
          {
            name: "🎭 Roles and Emoji",
            value: `Roles ${globalEmoji.arrow} **${guild.roles.cache.size}**\nEmoji ${globalEmoji.arrow} **${guild.emojis.cache.size}**\nSticker ${globalEmoji.arrow} **${guild.stickers.cache.size}**`,
            inline: false,
          },
          {
            name: "👥 Total Members",
            value: `${globalEmoji.arrow} **${guild.memberCount}** members`,
            inline: false,
          },
          {
            name: "📅 Created At",
            value: `${globalEmoji.arrow} ${new Date(guild.createdTimestamp).toLocaleDateString('en-GB', {
              day: '2-digit',        // DD (e.g., 25)
              month: 'short',        // MMM (e.g., Feb)
              year: 'numeric'        // YYYY (e.g., 2025)
            }).replace(/ /g, ' - ')}`, // Replace spaces with " - "
            inline: false
          },
        ])
        .setImage(
            guild.bannerURL()
                ? guild.bannerURL({ size: 1024 })
                : client.config.links.banner
        )
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction
        ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
        : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};
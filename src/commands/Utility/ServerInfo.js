const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");
const verificationLevels = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Very High"
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
      aliases: ["guildinfo", "server", 'sv'],
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
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
    }

    const { guild } = ctx;

    // Fetch all members of the guild
    const members = await guild.members.fetch();

    const onlineCount = members.filter(member => member.presence?.status === "online").size;
    const idleCount = members.filter(member => member.presence?.status === "idle").size;
    const dndCount = members.filter(member => member.presence?.status === "dnd").size;
    const offlineCount = members.filter(member => !member.presence || member.presence?.status === "offline").size;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Count members offline for 7 days and 30 days
    const offline7Days = members.filter(
        member => !member.presence && member.joinedTimestamp < sevenDaysAgo
    ).size;

    const offline30Days = members.filter(
        member => !member.presence && member.joinedTimestamp < thirtyDaysAgo
    ).size;

    const description = `
    **𝑰𝑫** ${globalEmoji.arrow} ${guild.id}
    **𝑵𝒂𝒎𝒆** ${globalEmoji.arrow} ${guild.name}
    **𝑶𝒘𝒏𝒆𝒓** ${globalEmoji.arrow} <@${guild.ownerId}>
    **𝑽𝒆𝒓𝒊𝒇𝒊𝒄𝒂𝒕𝒊𝒐𝒏** ${globalEmoji.arrow} ${verificationLevels[guild.verificationLevel]}\n
    **𝑪𝒉𝒂𝒏𝒏𝒆𝒍**\n- **𝑪𝒂𝒕𝒆𝒈𝒐𝒓𝒊𝒆𝒔** ${guild.channels.cache.filter(ch => ch.type === 4).size}\n- **𝑻𝒆𝒙𝒕 𝒄𝒉𝒂𝒏𝒏𝒆𝒍𝒔** ${guild.channels.cache.filter(ch => ch.type === 0).size}\n- **𝑽𝒐𝒊𝒄𝒆 𝒄𝒉𝒂𝒏𝒏𝒆𝒍𝒔** ${guild.channels.cache.filter(ch => ch.type === 2).size}\n
    **𝑴𝒆𝒎𝒃𝒆𝒓 𝑺𝒕𝒂𝒕𝒖𝒔**\n- **𝑶𝒏𝒍𝒊𝒏𝒆** ${onlineCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n- **𝑰𝒅𝒍𝒆** ${idleCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n- **𝑫𝒐 𝑵𝒐𝒕 𝑫𝒊𝒔𝒕𝒖𝒓𝒃** ${dndCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n- **𝑶𝒇𝒇𝒍𝒊𝒏𝒆** ${offlineCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n
    **𝑶𝒇𝒇𝒍𝒊𝒏𝒆 𝑴𝒆𝒎𝒃𝒆𝒓𝒔**\n- **7 𝑫𝒂𝒚𝒔** ${offline7Days} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n- **30 𝑫𝒂𝒚𝒔** ${offline30Days} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n
    **𝑩𝒐𝒐𝒔𝒕𝒔** ${globalEmoji.arrow} ${guild.premiumSubscriptionCount || 0}\n
    **𝑩𝒐𝒐𝒔𝒕 𝒍𝒆𝒗𝒆𝒍** ${globalEmoji.arrow} ${guild.premiumTier}\n
    **𝑹𝒐𝒍𝒆𝒔** ${globalEmoji.arrow} ${guild.roles.cache.size}\n
    **𝑬𝒎𝒐𝒋𝒊** ${globalEmoji.arrow} ${guild.emojis.cache.size}\n
    **𝑺𝒕𝒊𝒄𝒌𝒆𝒓** ${globalEmoji.arrow} ${guild.stickers.cache.size}\n
    **𝑨𝒍𝒍 𝑴𝒆𝒎𝒃𝒆𝒓** ${globalEmoji.arrow} ${guild.memberCount} 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n
    **𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝑨𝒕** ${guild.createdAt.toDateString()} (${Math.floor((Date.now() - guild.createdAt) / (1000 * 60 * 60 * 24 * 365))} years ago)`;

    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', "𝐒𝐄𝐑𝐕𝐄𝐑 𝐈𝐍𝐅𝐎")
                .replace('%{mainRight}', emoji.mainRight) +
            description
        )
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction
        ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
        : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};

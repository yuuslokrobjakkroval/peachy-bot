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
        content: "𝑫𝒊𝒔𝒑𝒍𝒂𝒚𝒔 𝒊𝒏𝒇𝒐𝒓𝒎𝒂𝒕𝒊𝒐𝒏 𝒂𝒃𝒐𝒖𝒕 𝒕𝒉𝒆 𝒔𝒆𝒓𝒗𝒆𝒓",
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
        generalMessages.search.replace("%{loading}", emoji.searching)
      );
    } else {
      await ctx.sendDeferMessage(
        generalMessages.search.replace("%{loading}", emoji.searching)
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
          .replace("%{title}", "𝐒𝐄𝐑𝐕𝐄𝐑 𝐈𝐍𝐅𝐎")
          .replace("%{mainRight}", emoji.mainRight)
      )
      .addFields([
        {
          name: `🆔 𝑰𝑫`,
          value: `${globalEmoji.arrow} ***${guild.id}***`,
          inline: false,
        },
        {
          name: `📛 𝑵𝒂𝒎𝒆`,
          value: `${globalEmoji.arrow} ***${guild.name}***`,
          inline: false,
        },
        {
          name: `👑 𝑶𝒘𝒏𝒆𝒓`,
          value: `${globalEmoji.arrow} ***<@${guild.ownerId}>***`,
          inline: false,
        },
        {
          name: "🔒 𝑽𝒆𝒓𝒊𝒇𝒊𝒄𝒂𝒕𝒊𝒐𝒏",
          value: `${globalEmoji.arrow} ${
            verificationLevels[guild.verificationLevel]
          }`,
          inline: false,
        },
        {
          name: "📊 𝑪𝒉𝒂𝒏𝒏𝒆𝒍",
          value: `𝑪𝒂𝒕𝒆𝒈𝒐𝒓𝒊𝒆𝒔 ${globalEmoji.arrow} ***${
            guild.channels.cache.filter((ch) => ch.type === 4).size
          }***\n𝑻𝒆𝒙𝒕 𝒄𝒉𝒂𝒏𝒏𝒆𝒍𝒔 ${globalEmoji.arrow} ***${
            guild.channels.cache.filter((ch) => ch.type === 0).size
          }***\n𝑽𝒐𝒊𝒄𝒆 𝒄𝒉𝒂𝒏𝒏𝒆𝒍𝒔 ${globalEmoji.arrow} ***${
            guild.channels.cache.filter((ch) => ch.type === 2).size
          }***`,
          inline: false,
        },
        {
          name: "🧍 𝑴𝒆𝒎𝒃𝒆𝒓 𝑺𝒕𝒂𝒕𝒖𝒔",
          value: `𝑶𝒏𝒍𝒊𝒏𝒆 ${globalEmoji.arrow} ***${onlineCount}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n𝑰𝒅𝒍𝒆 ${globalEmoji.arrow} ***${idleCount}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n𝑫𝒐 𝑵𝒐𝒕 𝑫𝒊𝒔𝒕𝒖𝒓𝒃 ${globalEmoji.arrow} ***${dndCount}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n𝑶𝒇𝒇𝒍𝒊𝒏𝒆 ${globalEmoji.arrow} ***${offlineCount}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔`,
          inline: false,
        },
        {
          name: "📅 𝑶𝒇𝒇𝒍𝒊𝒏𝒆 𝑴𝒆𝒎𝒃𝒆𝒓𝒔",
          value: `7 𝑫𝒂𝒚𝒔 ${globalEmoji.arrow} ***${offline7Days}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔\n30 𝑫𝒂𝒚𝒔 ${globalEmoji.arrow} ***${offline30Days}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔`,
          inline: false,
        },
        {
          name: "🚀 𝑩𝒐𝒐𝒔𝒕 𝑰𝒏𝒇𝒐",
          value: `𝑩𝒐𝒐𝒔𝒕𝒔 ${globalEmoji.arrow} ***${
            guild.premiumSubscriptionCount || 0
          }***\n𝑩𝒐𝒐𝒔𝒕 𝒍𝒆𝒗𝒆𝒍 ${globalEmoji.arrow} ***${guild.premiumTier}***`,
          inline: false,
        },
        {
          name: "🎭 𝑹𝒐𝒍𝒆𝒔 𝒂𝒏𝒅 𝑬𝒎𝒐𝒋𝒊",
          value: `𝑹𝒐𝒍𝒆𝒔 ${globalEmoji.arrow} ***${guild.roles.cache.size}***\n𝑬𝒎𝒐𝒋𝒊 ${globalEmoji.arrow} ***${guild.emojis.cache.size}***\n𝑺𝒕𝒊𝒄𝒌𝒆𝒓 ${globalEmoji.arrow} ***${guild.stickers.cache.size}***`,
          inline: false,
        },
        {
          name: "👥 𝑻𝒐𝒕𝒂𝒍 𝑴𝒆𝒎𝒃𝒆𝒓𝒔",
          value: `${globalEmoji.arrow} ***${guild.memberCount}*** 𝒎𝒆𝒎𝒃𝒆𝒓𝒔`,
          inline: false,
        },
        {
          name: "📅 𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝑨𝒕",
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
        text:
          generalMessages.requestedBy.replace(
            "%{username}",
            ctx.author.displayName
          ) || `Requested by ${ctx.author.displayName}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    return ctx.isInteraction
      ? await ctx.interaction.editReply({ content: "", embeds: [embed] })
      : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};

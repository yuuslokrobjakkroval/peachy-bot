const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class UserInfo extends Command {
  constructor(client) {
    super(client, {
      name: "userinfo",
      description: {
        content: "𝑫𝒊𝒔𝒑𝒍𝒂𝒚𝒔 𝒊𝒏𝒇𝒐𝒓𝒎𝒂𝒕𝒊𝒐𝒏 𝒂𝒃𝒐𝒖𝒕 𝒂 𝒖𝒔𝒆𝒓",
        examples: ["userinfo @User"],
        usage: "userinfo [@User]",
      },
      category: "utility",
      aliases: ["user", "whois"],
      cooldown: 3,
      args: true,
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "user",
          description: "The user to get info about",
          type: 6, // USER type
          required: true,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const userInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.userInfoMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
    }

    const target =
        ctx.isInteraction
            ? ctx.interaction.options.getUser("user") || ctx.interaction.options.getMember("user") || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.message.mentions.users.first() || args[0];

    if (!target) {
      return ctx.sendErrorMessage(client, ctx, generalMessages?.userNotFound, color);
    }
    const { guild } = ctx;
    const userId = typeof target === 'string' ? target : target.id;
    const guildMember = guild.members.cache.get(userId);
    const user = guildMember?.user || target;
    let bannerURL;
    try {
      bannerURL = await target.fetch().then(user => user.bannerURL?.({ format: 'png', size: 1024 }));
      if (!bannerURL) {
        bannerURL = client.config.links.banner;
      }
    } catch (error) {
      bannerURL = client.config.links.banner;
    }
    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, extension: 'png' }))
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎")
                .replace("%{mainRight}", emoji.mainRight)
        )
        .addFields([
          { name: `🆔 **𝑰𝑫**`, value: `${globalEmoji.arrow} *${user.id}*`, inline: false },
          { name: `📛 **𝑵𝒂𝒎𝒆**`, value: `${globalEmoji.arrow} *${user.displayName}* (*${user.username}*)`, inline: false },
          {
            name: `🙋 **𝑱𝒐𝒊𝒏𝒆𝒅 ${guild.name} 𝒂𝒕**`,
            value: `*${globalEmoji.arrow} ${guildMember?.joinedTimestamp ? `${Math.floor((Date.now() - guildMember.joinedTimestamp) / (1000 * 60 * 60 * 24))} 𝒅𝒂𝒚𝒔 𝒂𝒈𝒐` : "N/A"}*`,
            inline: false
          },
          { name: `🤖 **𝑩𝒐𝒕**`, value: `${globalEmoji.arrow} *${user.bot ? "𝑻𝒓𝒖𝒆" : "𝑭𝒂𝒍𝒔𝒆"}*`, inline: false },
          { name: `🚀 **𝑩𝒐𝒐𝒔𝒕𝒆𝒅 𝒕𝒉𝒊𝒔 𝒔𝒆𝒓𝒗𝒆𝒓**`, value: `${globalEmoji.arrow} *${guildMember?.premiumSince ? "𝑻𝒓𝒖𝒆" : "𝑭𝒂𝒍𝒔𝒆"}*`, inline: false },
          { name: `⭐ **𝑻𝒐𝒑 𝒓𝒐𝒍𝒆**`, value: `${globalEmoji.arrow} *${guildMember?.roles.highest.name || "𝑵𝒐𝒏𝒆"}*`, inline: false },
          {
            name: `📜 **𝑳𝒊𝒔𝒕 𝑹𝒐𝒍𝒆𝒔**`,
            value: `*[${guildMember?.roles.cache.size - 1 || 0}]* ${globalEmoji.arrow} ${guildMember?.roles.cache.filter(role => role.id !== ctx.guild.id).map(role => role).join(", ") || userInfoMessages?.noRoles || "𝑵𝒐𝒏𝒆"}`,
            inline: false
          },
          {
            name: "📅 **𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝑨𝒕**",
            value: `${globalEmoji.arrow} *${Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365))}* 𝒚𝒆𝒂𝒓𝒔 𝒂𝒈𝒐`,
            inline: false
          }
        ])
        .setImage(bannerURL)
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};

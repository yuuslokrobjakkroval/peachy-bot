const { Command } = require("../../structures/index.js");
const globalEmoji = require("../../utils/Emoji");

module.exports = class UserInfo extends Command {
  constructor(client) {
    super(client, {
      name: "userinfo",
      description: {
        content: "Displays information about a user",
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

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace("%{loading}", globalEmoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace("%{loading}", globalEmoji.searching));
    }

    const target = ctx.isInteraction
        ? ctx.interaction.options.getUser("user") ||
        ctx.interaction.options.getMember("user") ||
        ctx.author
        : ctx.message.mentions.members.first() ||
        ctx.guild.members.cache.get(args[0]) ||
        ctx.message.mentions.users.first() ||
        args[0];

    if (!target) {
      return ctx.sendErrorMessage(client, ctx, generalMessages?.userNotFound, color);
    }
    const { guild } = ctx;
    const userId = typeof target === "string" ? target : target.id;
    const guildMember = guild.members.cache.get(userId);
    const user = guildMember?.user || target;
    let bannerURL;
    try {
      bannerURL = await target
          .fetch()
          .then((user) => user.bannerURL?.({ format: "png", size: 1024 }));
      if (!bannerURL) {
        bannerURL = client.config.links.banner;
      }
    } catch (error) {
      bannerURL = client.config.links.banner;
    }
    const embed = client
        .embed()
        .setColor(color.main)
        .setThumbnail(
            target.displayAvatarURL({ dynamic: true, extension: "png" })
        )
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "USER INFO")
                .replace("%{mainRight}", emoji.mainRight)
        )
        .addFields([
          {
            name: `🆔 ID`,
            value: `${globalEmoji.arrow} **${user.id}**`,
            inline: false,
          },
          {
            name: `📛 Name`,
            value: `${globalEmoji.arrow} **${user.displayName}** (**${user.username}**)`,
            inline: false,
          },
          {
            name: `🙋 Joined ${guild.name} at`,
            value: `**${globalEmoji.arrow} ${
                guildMember?.joinedTimestamp
                    ? `${Math.floor(
                        (Date.now() - guildMember.joinedTimestamp) /
                        (1000 * 60 * 60 * 24)
                    )} days ago`
                    : "N/A"
            }**`,
            inline: false,
          },
          {
            name: `🤖 Bot`,
            value: `${globalEmoji.arrow} **${user.bot ? "True" : "False"}**`,
            inline: false,
          },
          {
            name: `🚀 Boosted this server`,
            value: `${globalEmoji.arrow} **${
                guildMember?.premiumSince ? "True" : "False"
            }**`,
            inline: false,
          },
          {
            name: `⭐ Top role`,
            value: `${globalEmoji.arrow} **${
                guildMember?.roles.highest.name || "None"
            }**`,
            inline: false,
          },
          {
            name: "📅 Created At",
            value: `${globalEmoji.arrow} **${Math.floor(
                (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365)
            )}** years ago`,
            inline: false,
          },
        ])
        .setImage(bannerURL)
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
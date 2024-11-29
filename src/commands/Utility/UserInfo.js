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
    const userInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.userInfoMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.loading));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.loading));
    }

    // Fetch the user or member based on the context
    const target =
        ctx.isInteraction
            ? ctx.interaction.options.getUser("user") || ctx.interaction.options.getMember("user") || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.message.mentions.users.first() || args[0];

    if (!target) {
      return ctx.sendErrorMessage(
          client,
          ctx,
          generalMessages?.userNotFound || "User not found! Please mention a valid user or provide a valid user ID.",
          color
      );
    }

    const userId = typeof target === 'string' ? target : target.id;
    const { guild } = ctx;
    const guildMember = guild.members.cache.get(userId);
    const user = guildMember?.user || target;

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", "𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎")
                .replace("%{mainRight}", emoji.mainRight) +
            `**𝑰𝑫** ${globalEmoji.arrow} ${user.id}\n` +
            `**𝑵𝒂𝒎𝒆** ${globalEmoji.arrow} ${user.username}\n` +
            `**𝑱𝒐𝒊𝒏𝒆𝒅 ${guild.name} 𝒂𝒕** ${globalEmoji.arrow} ${guildMember?.joinedTimestamp ?
                `${Math.floor((Date.now() - guildMember.joinedTimestamp) / (1000 * 60 * 60 * 24))} 𝒅𝒂𝒚𝒔 𝒂𝒈𝒐 (${new Date(guildMember.joinedTimestamp).toLocaleString()})`
                : "N/A"}\n` +

            `**𝑩𝒐𝒕** ${globalEmoji.arrow} ${user.bot ? "𝑻𝒓𝒖𝒆" : "𝑭𝒂𝒍𝒔𝒆"}\n` +
            `**𝑩𝒐𝒐𝒔𝒕𝒆𝒅 𝒕𝒉𝒊𝒔 𝒔𝒆𝒓𝒗𝒆𝒓** ${globalEmoji.arrow} ${guildMember?.premiumSince ? "𝑻𝒓𝒖𝒆" : "𝑭𝒂𝒍𝒔𝒆"}\n` +
            `**𝑹𝒐𝒍𝒆𝒔 [${guildMember?.roles.cache.size - 1 || 0}]**\n` +
            `**𝑳𝒊𝒔𝒕 𝑹𝒐𝒍𝒆** ${globalEmoji.arrow} ${guildMember?.roles.cache.filter(role => role.id !== ctx.guild.id).map(role => role).join(", ") || userInfoMessages?.noRoles || "𝑵𝒐𝒏𝒆"}\n` +
            `**𝑻𝒐𝒑 𝒓𝒐𝒍𝒆** ${globalEmoji.arrow} ${guildMember?.roles.highest.name || "𝑵𝒐𝒏𝒆"}` +
            `**𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝒂𝒕** ${globalEmoji.arrow} ${Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365))} 𝒚𝒆𝒂𝒓𝒔 𝒂𝒈𝒐 (${new Date(user.createdTimestamp).toLocaleString()})\\n\``
        )
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};

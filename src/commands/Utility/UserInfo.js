const { Command } = require("../../structures/index.js");

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
      await ctx.interaction.reply(generalMessages.search);
    } else {
      await ctx.sendDeferMessage(generalMessages.search);
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
            `**User ID**: ${user.id}\n` +
            `**User Name**: ${user.username}#${user.discriminator}\n` +
            `**Joined ${guild.name} at**: ${guildMember?.joinedTimestamp ?
                `${Math.floor((Date.now() - guildMember.joinedTimestamp) / (1000 * 60 * 60 * 24))} days ago (${new Date(guildMember.joinedTimestamp).toLocaleString()})`
                : "N/A"}\n` +
            `**Created at**: ${Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365))} years ago (${new Date(user.createdTimestamp).toLocaleString()})\n` +
            `**Bot**: ${user.bot ? "True" : "False"}\n` +
            `**Boosted this server**: ${guildMember?.premiumSince ? "True" : "False"}\n` +
            `**Roles [${guildMember?.roles.cache.size - 1 || 0}]**\n` +
            `Total roles: ${guildMember?.roles.cache.filter(role => role.id !== ctx.guild.id).map(role => role).join(", ") || userInfoMessages?.noRoles || "None"}\n` +
            `**Top role**: ${guildMember?.roles.highest.name || "None"}`
        )
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction ? await ctx.interaction.editReply({ embeds: [embed] }) : await ctx.editMessage({ embeds: [embed] });
  }
};

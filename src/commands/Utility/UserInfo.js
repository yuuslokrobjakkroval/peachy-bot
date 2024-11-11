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
      args: false,
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
          required: false,
        },
      ],
    });
  }

  run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const userInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.userInfoMessages;

    const targetMember = ctx.isInteraction
        ? ctx.interaction.options.getUser('user') || ctx.author // Default to the author if no user is provided
        : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

    if (!targetMember) {
      return ctx.sendMessage(userInfoMessages?.userNotFound);
    }

    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(targetMember.displayAvatarURL({ dynamic: true }))
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', `𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 ${targetMember.user.username}`)
                .replace('%{mainRight}', emoji.mainRight)
        )
        .addFields(
            { name: userInfoMessages?.username, value: targetMember.user.tag, inline: true },
            { name: userInfoMessages?.userId, value: targetMember.user.id, inline: true },
            { name: userInfoMessages?.joinedServer, value: new Date(targetMember.joinedTimestamp).toLocaleDateString(), inline: true },
            { name: userInfoMessages?.accountCreated, value: new Date(targetMember.user.createdTimestamp).toLocaleDateString(), inline: true },
            { name: userInfoMessages?.roles, value: targetMember.roles.cache.map(role => role.name).join(', ') || userInfoMessages?.noRoles, inline: false }
        )
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
};

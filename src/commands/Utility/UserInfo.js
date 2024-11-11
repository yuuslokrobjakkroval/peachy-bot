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

  run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const userInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.userInfoMessages;

    // Fetch the user or member based on the context
    const target =
        ctx.isInteraction
            ? ctx.interaction.options.getUser("user") || ctx.interaction.options.getMember("user")
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.message.mentions.users.first();

    if (!target) {
      return ctx.sendErrorMessage(
          client,
          ctx,
          generalMessages?.userNotFound || "User not found! Please mention a valid user or provide a valid user ID.",
          color
      );
    }

    const guildMember = ctx.guild.members.cache.get(target.id); // Fetch GuildMember if available
    const user = guildMember?.user || target; // Use GuildMember user or fallback to the User object

    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
            generalMessages.title
                .replace("%{mainLeft}", emoji.mainLeft)
                .replace("%{title}", `𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 ${guildMember?.displayName || user.username}`)
                .replace("%{mainRight}", emoji.mainRight)
        )
        .addFields(
            {
              name: userInfoMessages?.username || "Username",
              value: `${user.username}#${user.discriminator}`,
              inline: true,
            },
            {
              name: userInfoMessages?.userId || "User ID",
              value: user.id,
              inline: true,
            },
            {
              name: userInfoMessages?.joinedServer || "Joined Server",
              value: guildMember?.joinedTimestamp ? new Date(guildMember.joinedTimestamp).toLocaleDateString() : "N/A",
              inline: true,
            },
            {
              name: userInfoMessages?.accountCreated || "Account Created",
              value: new Date(user.createdTimestamp).toLocaleDateString(),
              inline: true,
            },
            {
              name: userInfoMessages?.roles || "Roles",
              value: guildMember?.roles.cache.map((role) => role.name).join(", ") || userInfoMessages?.noRoles || "None",
              inline: false,
            }
        )
        .setFooter({
          text: generalMessages.requestedBy.replace("%{username}", ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
};

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
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
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

  async run(client, ctx, args, color, emoji, language) {
    const targetMember = ctx.isInteraction
        ? ctx.interaction.options.getUser('user') || ctx.author // Default to the author if no user is provided
        : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;

    if (!targetMember) {
      return ctx.sendMessage("User not found! Please mention a valid user or provide a valid user ID.");
    }

    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
        .setTitle(`User Info: ${targetMember.user.username}`)
        .addFields(
            { name: "Username", value: targetMember.user.tag, inline: true },
            { name: "User ID", value: targetMember.user.id, inline: true },
            { name: "Joined Server", value: new Date(targetMember.joinedTimestamp).toLocaleDateString(), inline: true },
            { name: "Account Created", value: new Date(targetMember.user.createdTimestamp).toLocaleDateString(), inline: true },
            { name: "Roles", value: targetMember.roles.cache.map(role => role.name).join(', ') || 'None', inline: false }
        )
        .setFooter({
          text: `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    await ctx.sendMessage({ embeds: [embed] });
  }
}

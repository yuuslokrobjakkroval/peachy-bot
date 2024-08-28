const { Command } = require("../../structures/index.js");
const { MessageEmbed } = require("discord.js");

class UserInfo extends Command {
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

  async run(client, ctx, args) {
    const member = ctx.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;
    const embed = new MessageEmbed()
      .setColor(client.color.main)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTitle(`User Info: ${member.user.username}`)
      .addFields(
        { name: "Username", value: member.user.tag, inline: true },
        { name: "User ID", value: member.user.id, inline: true },
        { name: "Joined Server", value: new Date(member.joinedTimestamp).toLocaleDateString(), inline: true },
        { name: "Account Created", value: new Date(member.user.createdTimestamp).toLocaleDateString(), inline: true },
        { name: "Roles", value: member.roles.cache.map(role => role.name).join(', '), inline: false }
      )
      .setFooter({
        text: `Requested by ${ctx.author.username}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
}

module.exports = UserInfo;

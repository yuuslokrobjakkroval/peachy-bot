const { Command } = require("../../structures/index.js");
const { MessageEmbed } = require("discord.js");

class ServerInfo extends Command {
  constructor(client) {
    super(client, {
      name: "serverinfo",
      description: {
        content: "Displays information about the server",
        examples: ["serverinfo"],
        usage: "serverinfo",
      },
      category: "utility",
      aliases: ["server", "guildinfo"],
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
    });
  }

  async run(client, ctx) {
    const { guild } = ctx;
    const embed = new MessageEmbed()
      .setColor(client.color.main)
      .setTitle(`Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Server Name", value: guild.name, inline: true },
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Region", value: guild.region, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Created On", value: guild.createdAt.toDateString(), inline: false }
      )
      .setFooter({
        text: `Requested by ${ctx.author.username}`,
        iconURL: ctx.author.displayAvatarURL(),
      })
      .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
}

module.exports = ServerInfo;

const { Command } = require("../../structures/index.js");

module.exports = class ServerInfo extends Command {
  constructor(client) {
    super(client, {
      name: "serverinfo",
      description: {
        content: "Displays information about the server",
        examples: ["serverinfo"],
        usage: "serverinfo",
      },
      category: "utility",
      aliases: ["guildinfo", "server", 'sv'],
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

  async run(client, ctx, args, color, emoji, language) {
    const { guild } = ctx;
    const embed = client.embed()
        .setColor(color.main)
        .setTitle(`Server Info: ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
            { name: "Name", value: guild.name, inline: true },
            { name: "ID", value: guild.id, inline: true },
            { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
            { name: "Members", value: `${guild.memberCount}`, inline: true },
            { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
            { name: "Created On", value: guild.createdAt.toDateString(), inline: false }
        )
        .setFooter({
          text: `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    await ctx.sendMessage({ embeds: [embed] });
  }
}

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
    const serverInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.serverInfoMessages;

    const embed = client.embed()
        .setColor(color.main)
        .setTitle(serverInfoMessages?.title.replace('%{server}', guild.name) || `Server Info: ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
            { name: serverInfoMessages?.nameLabel || "Name", value: guild.name, inline: true },
            { name: serverInfoMessages?.idLabel || "ID", value: guild.id, inline: true },
            { name: serverInfoMessages?.ownerLabel || "Owner", value: `<@${guild.ownerId}>`, inline: true },
            { name: serverInfoMessages?.membersLabel || "Members", value: `${guild.memberCount}`, inline: true },
            { name: serverInfoMessages?.rolesLabel || "Roles", value: `${guild.roles.cache.size}`, inline: true },
            { name: serverInfoMessages?.createdLabel || "Created On", value: guild.createdAt.toDateString(), inline: false }
        )
        .setFooter({
          text: serverInfoMessages?.footer.replace('%{user}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    await ctx.sendMessage({ embeds: [embed] });
  }
};

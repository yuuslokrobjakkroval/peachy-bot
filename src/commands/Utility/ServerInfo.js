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
      permissions: {
        dev: false,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
    });
  }

  run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const serverInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.serverInfoMessages;
    const { guild } = ctx;


    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', `𝐒𝐄𝐑𝐕𝐄𝐑 𝐈𝐍𝐅𝐎 ${guild.name}`)
                .replace('%{mainRight}', emoji.mainRight)
        )
        .addFields(
            { name: serverInfoMessages?.nameLabel || "Name", value: guild.name, inline: true },
            { name: serverInfoMessages?.idLabel || "ID", value: guild.id, inline: true },
            { name: serverInfoMessages?.ownerLabel || "Owner", value: `<@${guild.ownerId}>`, inline: true },
            { name: serverInfoMessages?.membersLabel || "Members", value: `${guild.memberCount}`, inline: true },
            { name: serverInfoMessages?.rolesLabel || "Roles", value: `${guild.roles.cache.size}`, inline: true },
            { name: serverInfoMessages?.createdLabel || "Created On", value: guild.createdAt.toDateString(), inline: false }
        )
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
};

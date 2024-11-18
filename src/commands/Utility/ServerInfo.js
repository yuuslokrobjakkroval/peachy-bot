const { Command } = require("../../structures/index.js");

const verificationLevels = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Very High"
};

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

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search);
    } else {
      await ctx.sendDeferMessage(generalMessages.search);
    }

    // const serverInfoMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.serverInfoMessages;
    const { guild } = ctx;

    const description = `
    **Server name**: ${guild.name}
    **Server ID**: ${guild.id}
    **Owner**: <@${guild.ownerId}>
    **Member Count**: ${guild.memberCount}
    **Created At**: ${guild.createdAt.toDateString()} (${Math.floor((Date.now() - guild.createdAt) / (1000 * 60 * 60 * 24 * 365))} years ago)
    **Total Roles**: ${guild.roles.cache.size}
    **Verification**: ${verificationLevels[guild.verificationLevel]}
    **Boosts**: ${guild.premiumSubscriptionCount || 0}
    **Boost level**: ${guild.premiumTier}

    **Channels**
    - **Categories**: ${guild.channels.cache.filter(ch => ch.type === 4).size}\n- **Text channels**: ${guild.channels.cache.filter(ch => ch.type === 0).size}\n- **Voice channels**: ${guild.channels.cache.filter(ch => ch.type === 2).size}`;

    const embed = client.embed()
        .setColor(color.main)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', "𝐒𝐄𝐑𝐕𝐄𝐑 𝐈𝐍𝐅𝐎")
                .replace('%{mainRight}', emoji.mainRight) +
            description
        )
        .setFooter({
          text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

    return ctx.isInteraction ? await ctx.interaction.editReply({ content: "", embeds: [embed] }) : await ctx.editMessage({ content: "", embeds: [embed] });
  }
};

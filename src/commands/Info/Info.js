const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = class Info extends Command {
  constructor(client) {
    super(client, {
      name: "info",
      description: {
        content: "𝑰𝒏𝒇𝒐𝒓𝒎𝒂𝒕𝒊𝒐𝒏 𝒂𝒃𝒐𝒖𝒕 𝒕𝒉𝒆 𝒃𝒐𝒕 𝒂𝒏𝒅 𝒊𝒕𝒔 𝒇𝒆𝒂𝒕𝒖𝒓𝒆𝒔",
        examples: ["info"],
        usage: "info",
      },
      category: "info",
      aliases: ["botinfo", "bi"],
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
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
    const infoMessages = language.locales.get(language.defaultLocale)?.informationMessages?.infoMessages;

    if (ctx.isInteraction) {
      await ctx.interaction.reply(generalMessages.search.replace('%{loading}', emoji.searching));
    } else {
      await ctx.sendDeferMessage(generalMessages.search.replace('%{loading}', emoji.searching));
    }

    const embed = client.embed()
        .setColor(color.main)
        .setDescription(
            generalMessages.title
                .replace('%{mainLeft}', emoji.mainLeft)
                .replace('%{title}', infoMessages.title)
                .replace('%{mainRight}', emoji.mainRight) +
            `${client.user.username} ${infoMessages.description}`)
        .addFields([
          {
            name: infoMessages.developer.title,
            value: `[${infoMessages.developer.value}](${client.config.links.support})`,
            inline: false,
          },
          {
            name: infoMessages.dashboard.title,
            value: `[𝐏𝐄𝐀𝐂𝐇𝐘](${client.config.links.dashboard})`,
            inline: false,
          },
          {
            name: infoMessages.facebook.title,
            value: `[𝐏𝐄𝐀𝐂𝐇 𝐀𝐍𝐃 𝐆𝐎𝐌𝐀](${client.config.links.facebook})`,
            inline: false,
          },
        ])
        .setFooter({ text: infoMessages.footer });

    const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support);
    const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite);
    const row = client.utils.createButtonRow(supportButton, inviteButton);

    return ctx.isInteraction
        ? await ctx.interaction.editReply({ content: "", embeds: [embed], components: [row] })
        : await ctx.editMessage({ content: "", embeds: [embed], components: [row] });
  }
};

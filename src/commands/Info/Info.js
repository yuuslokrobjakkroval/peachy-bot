const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = class Info extends Command {
  constructor(client) {
    super(client, {
      name: "info",
      description: {
        content: "Information about the bot and its features",
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

    const embed = this.client
        .embed()
        .setColor(color.main)
        .setTitle(`${emoji.mainLeft} ${infoMessages.title} ${emoji.mainRight}`)
        .setDescription(
            `${client.user.username} ${infoMessages.description}`
        )
        .addFields([
          {
            name: infoMessages.developer.title,
            value: `[${infoMessages.developer.value}](${client.config.links.support})`,
            inline: false,
          },
        ])
        .setFooter({ text: infoMessages.footer });

    const supportButton = client.utils.linkButton(generalMessages.supportButton, client.config.links.support)
    const inviteButton = client.utils.linkButton(generalMessages.inviteButton, client.config.links.invite)
    const voteButton = client.utils.linkButton(generalMessages.voteButton, client.config.links.vote)
    const row = client.utils.createButtonRow(supportButton, inviteButton, voteButton);

    return await ctx.sendMessage({ embeds: [embed], components: [row] });
  }
}

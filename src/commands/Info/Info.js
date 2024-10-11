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

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel(infoMessages.supportButton.label).setStyle(5).setURL(client.config.links.support)
    );

    return await ctx.sendMessage({ embeds: [embed], components: [row] });
  }
}

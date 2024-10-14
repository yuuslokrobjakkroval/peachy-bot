const { Command } = require("../../structures/index.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class Rules extends Command {
  constructor(client) {
    super(client, {
      name: "rules",
      description: {
        content: "Displays the rules for using the bot",
        examples: ["rules"],
        usage: "rules",
      },
      category: "info",
      aliases: ["guidelines"],
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
    const rulesMessages = language.locales.get(language.defaultLocale)?.informationMessages?.rulesMessages;
    const embed = this.client.embed()
        .setColor(color.main)
        .setTitle(rulesMessages.title)
        .setDescription(rulesMessages.description)
        .setFooter({
          text: rulesMessages.footer.replace('{botName}', this.client.user.username),
          iconURL: this.client.user.displayAvatarURL(),
        })
        .setTimestamp();

    // Add each rule to the embed
    rulesMessages.rules.forEach(rule => {
      embed.addFields({ name: rule.name, value: rule.value, inline: false });
    });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('support-link').setLabel('Click for Support').setStyle(ButtonStyle.Primary),
        // Uncomment below lines if you want to add more buttons
        // new ButtonBuilder().setLabel('Invite Me!').setStyle(ButtonStyle.Link).setURL(client.config.links.invite),
        // new ButtonBuilder().setLabel('Vote for Me').setStyle(ButtonStyle.Link).setURL(client.config.links.vote)
    );

    return await ctx.sendMessage({ embeds: [embed], components: [row] });
  }
};

const { Command } = require("../../structures/index.js");
const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

module.exports = class PrivacyPolicy extends Command {
  constructor(client) {
    super(client, {
      name: "privacy",
      description: {
        content: "Displays the bot's privacy policy",
        examples: ["privacy"],
        usage: "privacy",
      },
      category: "info",
      aliases: ["policy", "privacypolicy"],
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
    const privacyMessages = language.locales.get(language.defaultLocale)?.informationMessages?.privacyMessages;

    const embed = this.client.embed()
        .setColor(color.main)
        .setTitle(privacyMessages.title)
        .setDescription(privacyMessages.description);

    // Add fields dynamically from the policies array
    privacyMessages.policies.forEach(policy => {
      embed.addFields({ name: policy.name, value: policy.value, inline: false });
    });

    embed.setFooter({
      text: privacyMessages.footer.replace('{botName}', this.client.user.username), // Replace {botName} with actual bot name
      iconURL: this.client.user.displayAvatarURL(),
    }).setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('support-link').setLabel('Click for Support').setStyle(ButtonStyle.Primary)
    );

    return await ctx.sendMessage({ embeds: [embed], components: [row] });
  }
}

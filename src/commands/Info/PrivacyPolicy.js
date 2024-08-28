const { Command } = require("../../structures/index.js");

class PrivacyPolicy extends Command {
  constructor(client) {
    super(client, {
      name: "privacy",
      description: {
        content: "Displays the bot's privacy policy",
        examples: ["privacy"],
        usage: "privacy",
      },
      category: "utility",
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

  async run(client, ctx) {
    const embed = this.client.embed()
      .setColor(this.client.color.main)
      .setTitle(`Privacy Policy`)
      .setDescription(`Your privacy is important to us. Please read our privacy policy below:`)
      .addFields(
        { name: "1. Data Collection", value: "We collect only the necessary data to provide and improve the bot's functionality. This may include user IDs, messages, and server information.", inline: false },
        { name: "2. Data Usage", value: "The collected data is used exclusively for bot operations and is not shared with third parties.", inline: false },
        { name: "3. Data Retention", value: "Data is retained only as long as necessary to fulfill the bot's purposes or as required by law.", inline: false },
        { name: "4. User Rights", value: "You have the right to request data deletion or obtain a copy of your data at any time. Please contact the bot owner for such requests.", inline: false },
        { name: "5. Changes to Policy", value: "We may update this privacy policy as needed. Continued use of the bot constitutes acceptance of any changes.", inline: false }
      )
      .setFooter({
        text: `For more details, contact the bot owner.`,
        iconURL: this.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
}

module.exports = PrivacyPolicy;

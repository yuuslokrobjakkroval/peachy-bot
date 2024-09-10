const { Command } = require("../../structures/index.js");

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

  async run(client, ctx) {
    const embed = this.client.embed()
      .setColor(this.client.color.main)
      .setTitle(`Bot Rules`)
      .setDescription(`Please read and follow the rules below to ensure a smooth and enjoyable experience for everyone:`)
      .addFields(
        { name: "1. Respect Others", value: "Treat everyone with respect. Harassment, abuse, and hate speech are not tolerated.", inline: false },
        { name: "2. No Spamming", value: "Avoid spamming commands or messages in chat. It disrupts the experience for others.", inline: false },
        { name: "3. Follow the Server Rules", value: "In addition to these bot-specific rules, ensure you also follow the rules of the server you're in.", inline: false },
        { name: "4. Appropriate Content", value: "Ensure that all content shared or generated using the bot is appropriate and adheres to the server's guidelines.", inline: false },
        { name: "5. Report Issues", value: "If you encounter any issues or bugs with the bot, report them to the bot owner or moderators.", inline: false }
      )
      .setFooter({
        text: `Thank you for using ${this.client.user.username}!`,
        iconURL: this.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    ctx.sendMessage({ embeds: [embed] });
  }
}

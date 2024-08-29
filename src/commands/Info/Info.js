const { Command } = require("../../structures/index.js");

class Info extends Command {
  constructor(client) {
    super(client, {
      name: "info",
      description: {
        content: "Information about the bot and its features",
        examples: ["info"],
        usage: "info",
      },
      category: "utility",
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

  async run(client, ctx) {
    const botName = "PEACHY";
    const botDescription = "A multi-purpose bot designed for fun and enjoyment!";
    const botFeatures = `
**Fun and Games**: Enjoy various games and gambling features, from slot machines to quizzes.
**Social Interaction**: Engage with custom commands and interactive features.
**Utility**: Manage server settings and get useful information easily.`;

    const botOwnerInfo = `
**Bot Owner Information**:
- **Discord:** [DADDY KYUU](https://discord.com/users/966688007493140591)
- **Facebook:** [Thoeurn Rothanak](https://www.facebook.com/thoeurnrothanak?mibextid=LQQJ4d)`;

    const botInfo = `**Bot Information**:
- **Name:** ${botName}
- **Description:** ${botDescription}
- **Features:** ${botFeatures}
${botOwnerInfo}`;

    const embed = this.client.embed();
    return await ctx.sendMessage({
      embeds: [embed.setColor(this.client.color.main).setDescription(botInfo)],
    });
  }
}

module.exports = Info;

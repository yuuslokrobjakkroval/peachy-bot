const { Command } = require("../../structures/index.js");

class Info extends Command {
  constructor(client) {
    super(client, {
      name: "info",
      description: {
        content: "Information about the bot owner",
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
    const botOwnerInfo = `**Bot Owner Information**:
- **Discord:** [DADDY KYUU](https://discord.com/users/966688007493140591)
- **Facebook:** [Thoeurn Rothanak](https://www.facebook.com/thoeurnrothanak?mibextid=LQQJ4d)`;

    const embed = this.client.embed();
    return await ctx.sendMessage({
      embeds: [embed.setColor(this.client.color.main).setDescription(botOwnerInfo)],
    });
  }
}

module.exports = Info;

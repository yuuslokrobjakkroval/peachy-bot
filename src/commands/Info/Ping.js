const { Command } = require("../../structures/index.js");

module.exports = class Ping extends Command {
  constructor(client) {
    super(client, {
      name: "ping",
      description: {
        content: "Shows the bot's ping",
        examples: ["ping"],
        usage: "ping",
      },
      category: "utility",
      aliases: ["pong"],
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
    const embed = client
      .embed()
        .setTitle(`**${client.emoji.mainLeft} 𝐏𝐎𝐍𝐆 ${client.emoji.mainRight}**`)
        .setColor(this.client.color.main)
        .setThumbnail(ctx.author.displayAvatarURL())
        .addFields([
          {
            name: `𝐁𝐎𝐓 ${client.emoji.ping}`,
            value: `\`\`\`ini\n[ ${ctx.createdTimestamp - ctx.createdTimestamp}ms ]\n\`\`\``,
            inline: true,
          },
          {
            name: `𝐀𝐏𝐈 ${client.emoji.ping}`,
            value: `\`\`\`ini\n[ ${Math.round(ctx.client.ws.ping)}ms ]\n\`\`\``,
            inline: true,
          },
        ])
        .setTimestamp();
    await ctx.sendMessage({ content: "", embeds: [embed] });
  }
}
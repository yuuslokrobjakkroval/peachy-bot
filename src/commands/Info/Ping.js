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
      category: "info",
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

  async run(client, ctx, args, color, emoji, language) {
    await ctx.sendDeferMessage("Pinging...");
    let randomNumber = Math.floor(Math.random() * (30 - 15 + 1)) + 15;

    const embed = client
        .embed()
        .setTitle(`**${emoji.mainLeft} 𝐏𝐎𝐍𝐆 ${emoji.mainRight}**`)
        .setColor(color.main)
        .setThumbnail(ctx.author.displayAvatarURL())
        .addFields([
          {
            name: `𝐁𝐎𝐓 ${emoji.ping}`,
            value: `\`\`\`ini\n[ ${randomNumber}ms ]\n\`\`\``,
            inline: true,
          },
          {
            name: `𝐀𝐏𝐈 ${emoji.ping}`,
            value: `\`\`\`ini\n[ ${Math.round(ctx.client.ws.ping)}ms ]\n\`\`\``,
            inline: true,
          },
        ])
        .setTimestamp();
    await ctx.editMessage({ content: "", embeds: [embed] });
  }
}
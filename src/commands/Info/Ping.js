const { Command } = require("../../structures/index.js");
const { connect, connection } = require('mongoose');

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

    const dbPing = async () => {
      const currentNano = process.hrtime();
      await (require('mongoose')).connection.db.command({ ping: 1 });
      const time = process.hrtime(currentNano);
      return Math.round((time[0] * 1e9 + time[1]) * 1e-6);
    };

    const embed = client
        .embed()
        .setTitle(`**${emoji.mainLeft} 𝐏𝐎𝐍𝐆 ${emoji.mainRight}**`)
        .setColor(color.main)
        .setThumbnail(ctx.author.displayAvatarURL())
        .addFields([
          {
            name: `${client.utils.transformText('BOT', 'bold') }`,
            value: `\`\`\`ini\n[ ${randomNumber}ms ]\n\`\`\``,
            inline: true,
          },
          {
            name: `${client.utils.transformText('API', 'bold') }`,
            value: `\`\`\`ini\n[ ${Math.round(ctx.client.ws.ping)}ms ]\n\`\`\``,
            inline: true,
          },
          {
            name: `${client.utils.transformText('DB', 'bold') }`,
            value: `\`\`\`ini\n[ ${await dbPing()}ms ]\n\`\`\``,
            inline: true,
          },
        ])
        .setTimestamp();
    await ctx.editMessage({ content: "", embeds: [embed] });
  }
}
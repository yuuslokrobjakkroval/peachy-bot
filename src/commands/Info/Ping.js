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


    await ctx.editMessage({ content: "", embeds: [embed] });
  }
}
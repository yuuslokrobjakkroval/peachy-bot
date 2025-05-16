const { Command } = require("../../structures/index.js");
const ChopTools = require("../../assets/inventory/ChopTools.js");
const Woods = require("../../assets/inventory/Woods.js");

module.exports = class Chop extends Command {
  constructor(client) {
    super(client, {
      name: "chop",
      description: {
        content: "Go chopping for wood!",
        examples: ["chop"],
        usage: "chop",
      },
      category: "inventory",
      aliases: ["c"],
      cooldown: 3,
      args: false,
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
    return await client.resourceManager.gatherResource(
      ctx,
      "Chop",
      ChopTools,
      Woods,
      emoji,
      color,
      language
    );
  }
};

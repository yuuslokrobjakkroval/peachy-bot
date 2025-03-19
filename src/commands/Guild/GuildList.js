const { Command } = require("../../structures/index.js");

module.exports = class GuildList extends Command {
  constructor(client) {
    super(client, {
      name: "guildlist",
      description: {
        content: "List all guilds the bot is in",
        examples: ["guildlist"],
        usage: "guildlist",
      },
      category: "guild",
      aliases: ["glt"],
      cooldown: 3,
      args: false,
      permissions: {
        dev: true,
        staff: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: false,
      options: [],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const guilds = client.guilds.cache.map(
      (g) => `Name : **${g.name}**\nID : **${g.id}**`
    );
    let chunks = client.utils.chunk(guilds, 10);
    if (chunks.length === 0) chunks = 1;
    const pages = [];
    for (let i = 0; i < chunks.length; i++) {
      const embed = client
        .embed()
        .setColor(color.main)
        .setDescription(chunks[i].join("\n\n"))
        .setFooter({ text: `Page ${i + 1} of ${chunks.length}` });
      pages.push(embed);
    }
    return await client.utils.reactionPaginate(ctx, pages);
  }
};

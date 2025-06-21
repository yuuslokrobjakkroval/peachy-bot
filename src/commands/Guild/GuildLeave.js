const { Command } = require("../../structures/index.js");

module.exports = class GuildLeave extends Command {
  constructor(client) {
    super(client, {
      name: "guildleave",
      description: {
        content: "Leave a guild",
        examples: ["guildleave"],
        usage: "guildleave",
      },
      category: "guild",
      aliases: ["gl"],
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

  run(client, ctx, args, color, emoji, language) {
    const guild = client.guilds.cache.get(args[0]);
    if (!guild) return ctx.sendMessage("Guild not found");
    guild.leave().catch((err) => console.error(err));
    return client.utils.sendSuccessMessage(
      client,
      ctx,
      `Left guild ${guild.name}`,
      color,
    );
  }
};

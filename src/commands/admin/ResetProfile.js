const { Command } = require("../../structures/index.js");

module.exports = class ResetProfile extends Command {
  constructor(client) {
    super(client, {
      name: "resetprofile",
      description: {
        content: "Resets the bot's avatar, banner, username, and status.",
        examples: ["resetprofile"],
        usage: "resetprofile",
      },
      category: "utility",
      aliases: ["resetbot"],
      cooldown: 10,
      args: false,
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel"],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  async run(client, ctx, args, color) {
    try {
      await client.user.setAvatar(null); // Reset avatar
      await client.user.setBanner(null); // Reset banner (requires Nitro)
      await client.user.setUsername(client.user.username); // Refresh username
      client.user.setPresence({ status: "online", activities: [] }); // Reset status

      return ctx.reply("✅ Bot profile has been reset to default.");
    } catch (error) {
      console.error("Failed to reset bot profile:", error);
      return client.utils.sendErrorMessage(client, ctx, "Failed to reset bot profile. Make sure the bot has Nitro for banner reset.", color);
    }
  }
};

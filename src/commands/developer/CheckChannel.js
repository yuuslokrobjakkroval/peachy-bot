const { Command } = require("../../structures/index.js");

module.exports = class CheckChannelInAllServers extends Command {
  constructor(client) {
    super(client, {
      name: "checkchannel",
      description: {
        content:
          "Check a channel by ID in all servers where the bot is present.",
        examples: ["checkchannel <channelId>"],
        usage: "checkchannel <channelId>",
      },
      category: "developer",
      aliases: ["checkchannel", "cc"],
      cooldown: 5,
      args: true,
      permissions: {
        dev: true,
        staff: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "channelid",
          type: 3,
          description: "The ID of the channel to check across all servers.",
          required: true,
        },
      ],
    });
  }

  run(client, ctx, args, color, emoji, language) {
    try {
      const channelId = ctx.isInteraction
        ? ctx.interaction.options.getString("channelid")
        : args[0];

      const result = [];

      // Loop through all guilds the bot is in
      client.guilds.cache.forEach((guild) => {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
          result.push(
            `**Server Name:** ${guild.name} (ID: ${guild.id})\n**Channel Name:** <#${channelId}> (${channel.name})\n**Channel ID:** ${channelId}`
          );
        }
      });

      if (result.length === 0) {
        return ctx.sendMessage({
          content:
            "The specified channel ID was not found in any of the servers the bot is in.",
          flags: 64,
        });
      }

      const embed = client
        .embed()
        .setColor(color.main)
        .setTitle("Channel Check Results Across All Servers:")
        .setDescription(result.join("\n\n"));

      return ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      console.error("Error in Check Channel in All Servers command:", error);
      return client.utils.sendErrorMessage(
        client,
        ctx,
        "An error occurred while checking the channel in all servers.",
        color
      );
    }
  }
};

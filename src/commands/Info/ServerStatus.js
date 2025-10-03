const { Command } = require("../../structures/index.js");

module.exports = class ServerStatus extends Command {
  constructor(client) {
    super(client, {
      name: "serverstatus",
      description: {
        content: "Check the current server mode and statistics.",
        examples: ["serverstatus"],
        usage: "serverstatus",
      },
      category: "info",
      aliases: ["sstatus", "serverinfo"],
      cooldown: 5,
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
    const serverMessages = language.locales.get(language.defaultLocale)
      ?.infoMessages?.serverMessages;

    const user = await client.serverModeManager.getUserData(
      ctx.author.id,
      ctx.guild?.id
    );
    const guildId = ctx.guild?.id;

    try {
      const serverMode = await client.serverModeManager.getServerMode(guildId);
      const stats = await client.serverModeManager.getServerModeStats(guildId);

      let userCount = 0;
      if (serverMode === "private") {
        const guildUsers =
          await client.serverModeManager.getGuildUsers(guildId);
        userCount = guildUsers.length;
      }

      const modeEmoji = serverMode === "global" ? "🌍" : "🏠";
      const modeColor = serverMode === "global" ? color.blue : color.pink;
      const modeDescription = this.getModeDescription(
        serverMode,
        serverMessages
      );

      const embed = client
        .embed()
        .setTitle(
          `${emoji.mainLeft} ${modeEmoji} ${ctx.guild.name} - Server Status ${emoji.mainRight}`
        )
        .setColor(modeColor)
        .setDescription(modeDescription)
        .addFields([
          {
            name: "🔧 Current Mode",
            value: `\`\`\`${serverMode.toUpperCase()}\`\`\``,
            inline: true,
          },
          {
            name: "👥 Active Users",
            value:
              serverMode === "private"
                ? `\`\`\`${userCount} users with data\`\`\``
                : "`All users use global data`",
            inline: true,
          },
          {
            name: "🔄 Mode Switches",
            value: `\`\`\`${stats?.totalSwitches || 0} times\`\`\``,
            inline: true,
          },
        ])
        .setThumbnail(ctx.guild.iconURL())
        .setFooter({
          text: ctx.author.displayName,
          iconURL: ctx.author.displayAvatarURL(),
        })
        .setTimestamp();

      if (stats?.lastSwitched) {
        embed.addFields([
          {
            name: "🕒 Last Mode Switch",
            value: `<t:${Math.floor(stats.lastSwitched.getTime() / 1000)}:R>`,
            inline: false,
          },
        ]);
      }

      // Add helpful information based on current mode
      if (serverMode === "global") {
        embed.addFields([
          {
            name: "ℹ️ Global Mode Benefits",
            value:
              serverMessages?.globalBenefits ||
              "• Same balance across all servers\n• Progress carries everywhere\n• Universal leaderboards\n• Cross-server economy",
            inline: false,
          },
        ]);
      } else {
        embed.addFields([
          {
            name: "ℹ️ Private Mode Benefits",
            value:
              serverMessages?.privateBenefits ||
              "• Server-specific progress\n• Independent economy\n• Custom server rules\n• Private competitions",
            inline: false,
          },
          {
            name: "💡 Available Actions",
            value:
              serverMessages?.privateActions ||
              "• Use `servermode import` to import your global data\n• Use `servermode export` to export to global\n• Admins can switch modes with `servermode set`",
            inline: false,
          },
        ]);
      }

      await ctx.sendMessage({ embeds: [embed] });
    } catch (error) {
      client.logger.error("Error in serverstatus command:", error);

      const errorEmbed = client
        .embed()
        .setColor(color.danger)
        .setTitle("❌ Error")
        .setDescription(
          serverMessages?.error ||
            "An error occurred while fetching server status."
        )
        .setTimestamp();

      await ctx.sendMessage({ embeds: [errorEmbed] });
    }
  }

  getModeDescription(mode, messages) {
    if (mode === "global") {
      return (
        messages?.globalDescription ||
        "🌍 This server is in **Global Mode**. Your data (balance, inventory, progress) is shared across all servers using this bot. Your achievements and economy progress will be the same everywhere!"
      );
    } else {
      return (
        messages?.privateDescription ||
        "🏠 This server is in **Private Mode**. Your data is specific to this server only. Your progress here is completely separate from other servers, allowing for unique server-specific gameplay and economy."
      );
    }
  }
};

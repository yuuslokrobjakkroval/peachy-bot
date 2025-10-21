const Command = require("../../structures/Command.js");
const ServerStats = require("../../schemas/serverStats.js");
const { ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = class ServerStatsAdmin extends Command {
  constructor(client) {
    super(client, {
      name: "serverstatsadmin",
      description: {
        content: "Admin controls for the server statistics system",
        examples: [
          "serverstatsadmin status",
          "serverstatsadmin force-update",
          "serverstatsadmin guild 123456789",
        ],
        usage: "serverstatsadmin [status|force-update|guild <guildId>|restart]",
      },
      category: "admin",
      aliases: ["ssadmin", "statsadmin"],
      cooldown: 3,
      args: false,
      player: {
        voice: false,
        dj: false,
        active: false,
        djPerm: null,
      },
      permissions: {
        dev: true,
        client: ["SendMessages", "ViewChannel", "EmbedLinks"],
        user: [],
      },
      slashCommand: true,
      options: [
        {
          name: "action",
          description: "What action do you want to perform?",
          type: 3,
          required: false,
          choices: [
            { name: "System Status", value: "status" },
            { name: "Force Update All", value: "force-update" },
            { name: "Restart Manager", value: "restart" },
            { name: "Guild Info", value: "guild-info" },
          ],
        },
        {
          name: "guild_id",
          description: "Guild ID for specific operations",
          type: 3,
          required: false,
        },
      ],
    });
  }

  async run(client, ctx, args, color, emoji, language) {
    const action = args[0] || "status";
    const guildId = args[1];

    switch (action.toLowerCase()) {
      case "status":
        await this.showSystemStatus(client, ctx, color, emoji);
        break;
      case "force-update":
        await this.forceUpdateAll(client, ctx, color, emoji);
        break;
      case "restart":
        await this.restartManager(client, ctx, color, emoji);
        break;
      case "guild-info":
      case "guild":
        await this.showGuildInfo(
          client,
          ctx,
          guildId || ctx.guild?.id,
          color,
          emoji
        );
        break;
      default:
        await this.showHelp(client, ctx, color, emoji);
        break;
    }
  }

  async showSystemStatus(client, ctx, color, emoji) {
    try {
      const managerStatus = client.serverStatsManager.getStatus();
      const totalGuilds = await ServerStats.countDocuments();
      const activeGuilds = await ServerStats.countDocuments({
        "settings.isEnabled": true,
      });
      const totalChannels = await ServerStats.aggregate([
        { $match: { "settings.isEnabled": true } },
        { $project: { channelCount: { $size: "$channels" } } },
        { $group: { _id: null, total: { $sum: "$channelCount" } } },
      ]);

      const statusEmbed = client
        .embed()
        .setColor(managerStatus.isRunning ? color.success : color.danger)
        .setTitle("📊 Server Stats System Status")
        .setDescription(
          `**Manager Status:** ${managerStatus.isRunning ? "🟢 Running" : "🔴 Stopped"}\n` +
            `**Update Interval:** ${managerStatus.isRunning ? "10 minutes" : "N/A"}\n` +
            `**Bot Guilds:** ${client.guilds.cache.size}\n\n` +
            `**Statistics:**\n` +
            `📈 Total Configurations: ${totalGuilds}\n` +
            `✅ Active Guilds: ${activeGuilds}\n` +
            `📊 Total Stat Channels: ${totalChannels[0]?.total || 0}\n` +
            `🤖 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        )
        .setFooter({
          text: "Use buttons below for quick actions",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const forceUpdateButton = new ButtonBuilder()
        .setCustomId("force_update_all")
        .setLabel("🔄 Force Update All")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!managerStatus.isRunning);

      const restartButton = new ButtonBuilder()
        .setCustomId("restart_manager")
        .setLabel("♻️ Restart Manager")
        .setStyle(ButtonStyle.Secondary);

      const refreshButton = new ButtonBuilder()
        .setCustomId("refresh_status")
        .setLabel("🔃 Refresh")
        .setStyle(ButtonStyle.Success);

      const row = client.utils.createButtonRow(
        forceUpdateButton,
        restartButton,
        refreshButton
      );

      const replyMessage = await ctx.sendMessage({
        embeds: [statusEmbed],
        components: [row],
        fetchReply: true,
      });

      // Handle button interactions
      const collector = replyMessage.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === ctx.author.id,
        time: 120000, // 2 minutes
      });

      collector.on("collect", async (interaction) => {
        try {
          await interaction.deferUpdate();

          switch (interaction.customId) {
            case "force_update_all":
              await this.forceUpdateAll(
                client,
                { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
                color,
                emoji
              );
              break;
            case "restart_manager":
              await this.restartManager(
                client,
                { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
                color,
                emoji
              );
              break;
            case "refresh_status":
              await this.showSystemStatus(
                client,
                { ...ctx, sendMessage: (opts) => interaction.editReply(opts) },
                color,
                emoji
              );
              break;
          }
        } catch (error) {
          console.error("Button interaction error:", error);
        }
      });

      collector.on("end", () => {
        replyMessage.edit({ components: [] }).catch(() => {});
      });
    } catch (error) {
      console.error("Error showing system status:", error);
      await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setTitle("❌ Error")
            .setDescription(`Failed to get system status: ${error.message}`),
        ],
      });
    }
  }

  async forceUpdateAll(client, ctx, color, emoji) {
    try {
      const startTime = Date.now();

      // Show loading message
      const loadingEmbed = client
        .embed()
        .setColor(color.warning)
        .setTitle("🔄 Forcing Update...")
        .setDescription(
          "Starting forced update for all guilds. This may take a while..."
        )
        .setTimestamp();

      const message = await ctx.sendMessage({
        embeds: [loadingEmbed],
        fetchReply: true,
      });

      // Force update
      await client.serverStatsManager.updateAllServerStats();

      const duration = Date.now() - startTime;

      const successEmbed = client
        .embed()
        .setColor(color.success)
        .setTitle("✅ Force Update Complete")
        .setDescription(
          `Successfully completed force update for all server statistics!\n\n` +
            `⏱️ **Duration:** ${Math.round(duration / 1000)} seconds\n` +
            `📊 **Status:** All active guilds processed`
        )
        .setFooter({
          text: "Next automatic update in 10 minutes",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      await message.edit({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error forcing update:", error);
      await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setTitle("❌ Force Update Failed")
            .setDescription(`Error during force update: ${error.message}`),
        ],
      });
    }
  }

  async restartManager(client, ctx, color, emoji) {
    try {
      // Stop manager
      client.serverStatsManager.stop();

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Start manager
      client.serverStatsManager.start();

      const successEmbed = client
        .embed()
        .setColor(color.success)
        .setTitle("♻️ Manager Restarted")
        .setDescription(
          `Server Stats Manager has been successfully restarted!\n\n` +
            `🔄 **Status:** Running\n` +
            `⏰ **Next Update:** In 10 minutes\n` +
            `🎯 **Action:** All systems operational`
        )
        .setFooter({
          text: "Manager is now running normally",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      await ctx.sendMessage({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Error restarting manager:", error);
      await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setTitle("❌ Restart Failed")
            .setDescription(`Error restarting manager: ${error.message}`),
        ],
      });
    }
  }

  async showGuildInfo(client, ctx, guildId, color, emoji) {
    if (!guildId) {
      return ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.warning)
            .setTitle("❌ Missing Guild ID")
            .setDescription(
              "Please provide a guild ID to get information about."
            ),
        ],
      });
    }

    try {
      const guildInfo =
        await client.serverStatsManager.getGuildStatsInfo(guildId);

      if (!guildInfo) {
        return ctx.sendMessage({
          embeds: [
            client
              .embed()
              .setColor(color.warning)
              .setTitle("📋 No Statistics Found")
              .setDescription(
                `No server statistics configuration found for guild: \`${guildId}\``
              ),
          ],
        });
      }

      const statsText = Object.entries(guildInfo.statistics)
        .map(([type, value]) => `• **${type}:** ${value}`)
        .join("\n");

      const guildEmbed = client
        .embed()
        .setColor(color.main)
        .setTitle(`📊 Guild Statistics: ${guildInfo.guild.name}`)
        .setDescription(
          `**Guild Information:**\n` +
            `🏷️ **Name:** ${guildInfo.guild.name}\n` +
            `🆔 **ID:** ${guildInfo.guild.id}\n` +
            `👥 **Members:** ${guildInfo.guild.memberCount}\n\n` +
            `**Statistics Channels:** ${guildInfo.channels}\n` +
            `${statsText}\n\n` +
            `**System Info:**\n` +
            `🔄 **Last Update:** ${guildInfo.lastUpdate ? new Date(guildInfo.lastUpdate).toLocaleString() : "Never"}\n` +
            `📈 **Total Updates:** ${guildInfo.totalUpdates}`
        )
        .setFooter({
          text: "Statistics update every 10 minutes",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const forceUpdateButton = new ButtonBuilder()
        .setCustomId(`force_update_${guildId}`)
        .setLabel("🔄 Force Update Guild")
        .setStyle(ButtonStyle.Primary);

      const row = client.utils.createButtonRow(forceUpdateButton);

      const replyMessage = await ctx.sendMessage({
        embeds: [guildEmbed],
        components: [row],
        fetchReply: true,
      });

      // Handle force update for specific guild
      const collector = replyMessage.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === ctx.author.id,
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        try {
          await interaction.deferUpdate();

          if (interaction.customId.startsWith("force_update_")) {
            try {
              await client.serverStatsManager.forceUpdateGuild(guildId);

              const successEmbed = client
                .embed()
                .setColor(color.success)
                .setTitle("✅ Guild Updated")
                .setDescription(
                  `Successfully force updated statistics for ${guildInfo.guild.name}!`
                )
                .setTimestamp();

              await interaction.editReply({
                embeds: [successEmbed],
                components: [],
              });
            } catch (error) {
              const errorEmbed = client
                .embed()
                .setColor(color.danger)
                .setTitle("❌ Update Failed")
                .setDescription(`Failed to update guild: ${error.message}`)
                .setTimestamp();

              await interaction.editReply({
                embeds: [errorEmbed],
                components: [],
              });
            }
          }
        } catch (error) {
          console.error("Guild force update error:", error);
        }
      });

      collector.on("end", () => {
        replyMessage.edit({ components: [] }).catch(() => {});
      });
    } catch (error) {
      console.error("Error showing guild info:", error);
      await ctx.sendMessage({
        embeds: [
          client
            .embed()
            .setColor(color.danger)
            .setTitle("❌ Error")
            .setDescription(
              `Failed to get guild information: ${error.message}`
            ),
        ],
      });
    }
  }

  async showHelp(client, ctx, color, emoji) {
    const helpEmbed = client
      .embed()
      .setColor(color.main)
      .setTitle("🛡️ Server Stats Admin Help")
      .setDescription(
        `**Available Commands:**\n\n` +
          `• \`${client.prefix}serverstatsadmin status\` - Show system status\n` +
          `• \`${client.prefix}serverstatsadmin force-update\` - Force update all guilds\n` +
          `• \`${client.prefix}serverstatsadmin restart\` - Restart the stats manager\n` +
          `• \`${client.prefix}serverstatsadmin guild <id>\` - Show specific guild info\n\n` +
          `**System Information:**\n` +
          `🔄 **Auto Updates:** Every 10 minutes\n` +
          `📊 **Tracks:** Members, bots, boosts, emojis, channels, etc.\n` +
          `🛡️ **Admin Only:** This command requires developer permissions\n\n` +
          `**Quick Actions:**\n` +
          `Use the interactive buttons for common operations when available.`
      )
      .setFooter({
        text: "Server Statistics Admin Panel",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await ctx.sendMessage({ embeds: [helpEmbed] });
  }
};

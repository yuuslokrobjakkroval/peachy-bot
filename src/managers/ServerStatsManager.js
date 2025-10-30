const ServerStats = require("../schemas/serverStats.js");
const { ChannelType } = require("discord.js");

class ServerStatsManager {
  constructor(client) {
    this.client = client;
    this.updateInterval = null;
    this.isRunning = false;
    this._pendingUpdates = new Map();
    this._lastUpdateAt = new Map(); // guildId -> timestamp of last successful update
  }

  /**
   * Start the server stats update service
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🔄 Starting Server Stats Manager...");

    // Update immediately when starting
    this.updateAllServerStats();

    // Set up interval to update every 10 minutes
    this.updateInterval = setInterval(
      () => {
        this.updateAllServerStats();
      },
      10 * 60 * 1000
    ); // 10 minutes

    console.log("✅ Server Stats Manager started successfully!");
  }

  /**
   * Stop the server stats update service
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log("🛑 Server Stats Manager stopped.");
  }

  /**
   * Update statistics for all guilds
   */
  async updateAllServerStats() {
    try {
      const allServerStats = await ServerStats.find({
        "settings.isEnabled": true,
      });

      console.log(`🔄 Updating stats for ${allServerStats.length} guilds...`);

      let successCount = 0;
      let errorCount = 0;

      for (const serverStat of allServerStats) {
        try {
          await this.updateGuildStats(serverStat);
          successCount++;
        } catch (error) {
          console.error(
            `❌ Failed to update stats for guild ${serverStat.guildId}:`,
            error.message
          );
          errorCount++;

          // If guild is not found, mark as disabled or remove
          if (error.message.includes("Unknown Guild")) {
            await this.handleGuildNotFound(serverStat.guildId);
          }
        }
      }

      console.log(
        `✅ Stats update complete: ${successCount} successful, ${errorCount} errors`
      );
    } catch (error) {
      console.error("❌ Error in updateAllServerStats:", error);
    }
  }

  /**
   * Update statistics for a specific guild
   */
  async updateGuildStats(serverStat) {
    const guild = this.client.guilds.cache.get(serverStat.guildId);

    if (!guild) {
      throw new Error(`Unknown Guild: ${serverStat.guildId}`);
    }

    console.log(
      `ServerStats: beginning update for guild ${guild.id} (${guild.name}) with ${
        serverStat.channels?.length || 0
      } configured channels`
    );

    // Fetch all members if not cached (for accurate counts)
    if (!guild.members.cache.has(guild.ownerId)) {
      try {
        await guild.members.fetch();
      } catch (error) {
        console.warn(
          `⚠️ Could not fetch members for ${guild.name}: ${error.message}`
        );
      }
    }

    // Ensure member cache is fresh for accurate counts
    try {
      const needsMembers = serverStat.channels?.some((c) =>
        ["members", "humans", "bots", "voicemembers", "onlinemembers"].includes(
          c.type
        )
      );
      if (needsMembers) {
        await guild.members.fetch();
      }
    } catch (error) {
      console.warn(
        `Could not fetch members for ${guild.name}: ${error.message}`
      );
    }

    let updatedChannels = 0;
    const channelsToRemove = [];

    for (const channelStat of serverStat.channels) {
      if (!channelStat.isActive) continue;

      try {
        const channel = guild.channels.cache.get(channelStat.channelId);

        if (!channel) {
          // Channel was deleted, mark for removal
          channelsToRemove.push(channelStat.channelId);
          continue;
        }

        // Get current stat value
        const currentValue = await this.getStatValue(guild, channelStat.type);

        // Extract the current channel name prefix (everything before the last number)
        const currentPrefix = channel.name.replace(/\s*\d+\s*$/, "").trim();
        const newName = `${currentPrefix} ${currentValue}`;

        // Only update if name changed (to avoid rate limits)
        if (channel.name === newName) {
          // Nothing to do
          // console.log(`ServerStats: no change for channel ${channel.id} (name already '${channel.name}')`);
        } else if (!channel.manageable) {
          console.warn(
            `Cannot rename channel ${channel.id} in ${guild.name} (missing permissions)`
          );
        } else {
          await channel.setName(
            newName,
            `Server Stats Update - ${channelStat.type}`
          );
          updatedChannels++;
        }
      } catch (error) {
        console.error(
          `❌ Error updating channel ${channelStat.channelId}:`,
          error.message
        );

        // If channel is deleted, mark for removal
        if (error.code === 10003) {
          // Unknown Channel
          channelsToRemove.push(channelStat.channelId);
        }
      }
    }

    // Remove deleted channels from database
    if (channelsToRemove.length > 0) {
      await ServerStats.updateOne(
        { guildId: serverStat.guildId },
        {
          $pull: {
            channels: { channelId: { $in: channelsToRemove } },
          },
        }
      );
      console.log(
        `🗑️ Removed ${channelsToRemove.length} deleted channels from ${guild.name}`
      );
    }

    // Update last update time and increment total updates
    await ServerStats.updateOne(
      { guildId: serverStat.guildId },
      {
        $inc: { "statistics.totalUpdates": 1 },
        $set: { "statistics.lastUpdate": new Date() },
      }
    );

    if (updatedChannels > 0) {
      console.log(`🔄 Updated ${updatedChannels} channels in ${guild.name}`);
    }
  }

  /**
   * Handle when a guild is not found (bot was removed)
   */
  async handleGuildNotFound(guildId) {
    try {
      await ServerStats.updateOne(
        { guildId },
        { $set: { "settings.isEnabled": false } }
      );
      console.log(`🔒 Disabled stats for missing guild: ${guildId}`);
    } catch (error) {
      console.error(`❌ Error disabling stats for guild ${guildId}:`, error);
    }
  }

  /**
   * Get the current value for a specific statistic type
   */
  async getStatValue(guild, statType) {
    // Debug: log which stat we're computing
    // Note: keep this lightweight to avoid spamming logs
    // Uncomment below line for verbose logging when needed
    // console.log(`ServerStats: computing '${statType}' for guild ${guild.id}`);

    switch (statType) {
      case "members":
        const membersCount = guild.memberCount;
        // console.log(`ServerStats: members -> ${membersCount} for guild ${guild.id}`);
        return membersCount.toString();

      case "bots":
        const botCount = guild.members.cache.filter((m) => m.user.bot).size;
        // console.log(`ServerStats: bots -> ${botCount} for guild ${guild.id}`);
        return botCount.toString();

      case "humans":
        const humanCount = guild.members.cache.filter((m) => !m.user.bot).size;
        // console.log(`ServerStats: humans -> ${humanCount} for guild ${guild.id}`);
        return humanCount.toString();

      case "boosts":
        return (guild.premiumSubscriptionCount || 0).toString();

      case "emojis":
        return guild.emojis.cache.size.toString();

      case "textchannels":
        return guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildText)
          .size.toString();

      case "voicechannels":
        return guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildVoice)
          .size.toString();

      case "categories":
        return guild.channels.cache
          .filter((c) => c.type === ChannelType.GuildCategory)
          .size.toString();

      case "roles":
        return (guild.roles.cache.size - 1).toString(); // Exclude @everyone role

      case "voicemembers":
        const voiceCount = guild.members.cache.filter(
          (m) => m.voice.channel
        ).size;
        // console.log(`ServerStats: voicemembers -> ${voiceCount} for guild ${guild.id}`);
        return voiceCount.toString();

      case "onlinemembers":
        const onlineCount = guild.members.cache.filter(
          (m) =>
            m.presence && ["online", "idle", "dnd"].includes(m.presence.status)
        ).size;
        // console.log(`ServerStats: onlinemembers -> ${onlineCount} for guild ${guild.id}`);
        return onlineCount.toString();

      case "threads":
        return guild.channels.cache.filter((c) => c.isThread()).size.toString();

      default:
        return "0";
    }
  }

  /**
   * Get stats for a specific guild (for testing/debugging)
   */
  async getGuildStatsInfo(guildId) {
    try {
      const serverStat = await ServerStats.findOne({ guildId });
      if (!serverStat) return null;

      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return null;

      const stats = {};
      for (const channelStat of serverStat.channels) {
        stats[channelStat.type] = await this.getStatValue(
          guild,
          channelStat.type
        );
      }

      return {
        guild: {
          name: guild.name,
          id: guild.id,
          memberCount: guild.memberCount,
        },
        statistics: stats,
        lastUpdate: serverStat.statistics.lastUpdate,
        totalUpdates: serverStat.statistics.totalUpdates,
        channels: serverStat.channels.length,
      };
    } catch (error) {
      console.error("Error getting guild stats info:", error);
      return null;
    }
  }

  /**
   * Force update stats for a specific guild
   */
  async forceUpdateGuild(guildId) {
    try {
      const serverStat = await ServerStats.findOne({ guildId });
      if (!serverStat) {
        throw new Error("No server stats configuration found");
      }

      await this.updateGuildStats(serverStat);
      // Record last update time to throttle frequent updates
      try {
        this._lastUpdateAt.set(guildId, Date.now());
      } catch (err) {
        // ignore
      }
      return true;
    } catch (error) {
      // Reduce noise for non-configured guilds; otherwise log
      if (error?.message !== "No server stats configuration found") {
        console.error(`Error force updating guild ${guildId}:`, error);
      }
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.updateInterval,
      intervalMs: this.updateInterval ? 10 * 60 * 1000 : null,
    };
  }

  /**
   * Schedule a debounced update for a guild (avoids spam on rapid events)
   */
  scheduleUpdate(guildId, delayMs = 3000) {
    if (!guildId) return;
    const existing = this._pendingUpdates.get(guildId);
    if (existing) clearTimeout(existing);

    // Throttle: ensure at least 10 seconds between successive updates per guild
    const MIN_INTERVAL = 10 * 1000; // 10 seconds
    const last = this._lastUpdateAt.get(guildId) || 0;
    const since = Date.now() - last;
    // If the last update was recent, ensure we wait the remaining time (or the provided delay, whichever is larger)
    const effectiveDelay =
      since < MIN_INTERVAL ? Math.max(delayMs, MIN_INTERVAL - since) : delayMs;

    const timeout = setTimeout(async () => {
      this._pendingUpdates.delete(guildId);
      try {
        // Only update if a configuration exists for this guild
        const hasConfig = await ServerStats.exists({ guildId });
        if (!hasConfig) return; // silently ignore non-configured guilds
        await this.forceUpdateGuild(guildId);
      } catch (err) {
        // Suppress noise when guild simply has no configuration
        if (err?.message === "No server stats configuration found") return;
        console.warn(
          `ServerStats scheduleUpdate failed for ${guildId}:`,
          err.message
        );
      }
    }, effectiveDelay);

    this._pendingUpdates.set(guildId, timeout);
  }
}

module.exports = ServerStatsManager;

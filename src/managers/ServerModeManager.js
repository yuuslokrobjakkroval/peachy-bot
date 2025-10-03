const ServerMode = require("../schemas/serverMode");
const User = require("../schemas/user");
const PrivateUser = require("../schemas/privateUser");
const Logger = require("../structures/Logger");

class ServerModeManager {
  constructor() {
    this.logger = new Logger();
    this.cache = new Map(); // Cache server modes for better performance
  }

  /**
   * Get server mode for a guild
   * @param {string} guildId - Guild ID
   * @returns {Promise<string>} - "global" or "private"
   */
  async getServerMode(guildId) {
    try {
      // Check cache first
      if (this.cache.has(guildId)) {
        return this.cache.get(guildId);
      }

      let serverMode = await ServerMode.findOne({ guildId });

      if (!serverMode) {
        // Create default server mode (global)
        serverMode = new ServerMode({
          guildId,
          mode: "global",
          enabledBy: "system", // Default system setup
        });
        await serverMode.save();
      }

      // Cache the result
      this.cache.set(guildId, serverMode.mode);
      return serverMode.mode;
    } catch (error) {
      this.logger.error(
        `Error getting server mode for guild ${guildId}:`,
        error
      );
      return "global"; // Default fallback
    }
  }

  /**
   * Set server mode for a guild
   * @param {string} guildId - Guild ID
   * @param {string} mode - "global" or "private"
   * @param {string} userId - User who is changing the mode
   * @param {string} reason - Reason for the change
   * @returns {Promise<boolean>} - Success status
   */
  async setServerMode(guildId, mode, userId, reason = null) {
    try {
      if (!["global", "private"].includes(mode)) {
        throw new Error("Invalid mode. Must be 'global' or 'private'");
      }

      let serverMode = await ServerMode.findOne({ guildId });
      const currentMode = serverMode ? serverMode.mode : "global";

      if (currentMode === mode) {
        return false; // No change needed
      }

      if (!serverMode) {
        serverMode = new ServerMode({
          guildId,
          mode,
          enabledBy: userId,
        });
      } else {
        // Update existing mode
        const oldMode = serverMode.mode;
        serverMode.mode = mode;
        serverMode.enabledBy = userId;
        serverMode.enabledAt = new Date();
        serverMode.statistics.totalSwitches += 1;
        serverMode.statistics.lastSwitched = new Date();

        // Add to switch history
        serverMode.statistics.switchHistory.push({
          fromMode: oldMode,
          toMode: mode,
          switchedBy: userId,
          switchedAt: new Date(),
          reason,
        });
      }

      await serverMode.save();

      // Update cache
      this.cache.set(guildId, mode);

      this.logger.info(
        `Server mode changed for guild ${guildId}: ${currentMode} -> ${mode} by ${userId}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error setting server mode for guild ${guildId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get user data based on server mode
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @returns {Promise<Object|null>} - User data or null
   */
  async getUserData(userId, guildId) {
    try {
      const mode = await this.getServerMode(guildId);

      if (mode === "global") {
        return await User.findOne({ userId });
      } else {
        return await PrivateUser.findOne({ userId, guildId });
      }
    } catch (error) {
      this.logger.error(
        `Error getting user data for ${userId} in guild ${guildId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Create or update user data based on server mode
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @param {Object} userData - User data to save
   * @returns {Promise<Object|null>} - Saved user data or null
   */
  async saveUserData(userId, guildId, userData = {}) {
    try {
      const mode = await this.getServerMode(guildId);

      if (mode === "global") {
        let user = await User.findOne({ userId });
        if (!user) {
          user = new User({ userId, ...userData });
        } else {
          Object.assign(user, userData);
        }
        return await user.save();
      } else {
        let user = await PrivateUser.findOne({ userId, guildId });
        if (!user) {
          user = new PrivateUser({ userId, guildId, ...userData });
        } else {
          Object.assign(user, userData);
        }
        return await user.save();
      }
    } catch (error) {
      this.logger.error(
        `Error saving user data for ${userId} in guild ${guildId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Import global data to private mode
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @returns {Promise<boolean>} - Success status
   */
  async importGlobalDataToPrivate(userId, guildId) {
    try {
      const mode = await this.getServerMode(guildId);
      if (mode !== "private") {
        throw new Error("Guild must be in private mode to import global data");
      }

      // Check if private user already exists
      const existingPrivateUser = await PrivateUser.findOne({
        userId,
        guildId,
      });
      if (existingPrivateUser && existingPrivateUser.importedFrom.global) {
        return false; // Already imported
      }

      // Get global user data
      const globalUser = await User.findOne({ userId });
      if (!globalUser) {
        return false; // No global data to import
      }

      // Create private user with global data
      const globalData = globalUser.toObject();
      delete globalData._id;
      delete globalData.__v;
      delete globalData.createdAt;
      delete globalData.updatedAt;

      const privateUser = new PrivateUser({
        ...globalData,
        guildId,
        importedFrom: {
          global: true,
          importedAt: new Date(),
        },
      });

      await privateUser.save();

      this.logger.info(
        `Imported global data for user ${userId} to private mode in guild ${guildId}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error importing global data for ${userId} in guild ${guildId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Export private data to global mode
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @returns {Promise<boolean>} - Success status
   */
  async exportPrivateDataToGlobal(userId, guildId) {
    try {
      // Get private user data
      const privateUser = await PrivateUser.findOne({ userId, guildId });
      if (!privateUser) {
        return false; // No private data to export
      }

      // Get or create global user
      let globalUser = await User.findOne({ userId });
      if (!globalUser) {
        globalUser = new User({ userId });
      }

      // Merge private data into global (you might want to customize this logic)
      const privateData = privateUser.toObject();
      delete privateData._id;
      delete privateData.__v;
      delete privateData.guildId;
      delete privateData.createdAt;
      delete privateData.updatedAt;
      delete privateData.importedFrom;

      Object.assign(globalUser, privateData);
      await globalUser.save();

      this.logger.info(
        `Exported private data for user ${userId} from guild ${guildId} to global`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error exporting private data for ${userId} in guild ${guildId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get server mode statistics
   * @param {string} guildId - Guild ID
   * @returns {Promise<Object|null>} - Server mode statistics
   */
  async getServerModeStats(guildId) {
    try {
      const serverMode = await ServerMode.findOne({ guildId });
      return serverMode ? serverMode.statistics : null;
    } catch (error) {
      this.logger.error(
        `Error getting server mode stats for guild ${guildId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Clear cache for a specific guild
   * @param {string} guildId - Guild ID
   */
  clearCache(guildId) {
    this.cache.delete(guildId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get all users in a guild (for private mode)
   * @param {string} guildId - Guild ID
   * @returns {Promise<Array>} - Array of private users
   */
  async getGuildUsers(guildId) {
    try {
      const mode = await this.getServerMode(guildId);
      if (mode === "private") {
        return await PrivateUser.find({ guildId });
      }
      return []; // Global mode doesn't have guild-specific users
    } catch (error) {
      this.logger.error(
        `Error getting guild users for guild ${guildId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Delete all private data for a guild (when switching to global)
   * @param {string} guildId - Guild ID
   * @returns {Promise<number>} - Number of deleted documents
   */
  async deleteGuildPrivateData(guildId) {
    try {
      const result = await PrivateUser.deleteMany({ guildId });
      this.logger.info(
        `Deleted ${result.deletedCount} private user records for guild ${guildId}`
      );
      return result.deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting private data for guild ${guildId}:`,
        error
      );
      return 0;
    }
  }
}

module.exports = ServerModeManager;

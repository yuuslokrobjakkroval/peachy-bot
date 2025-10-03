const globalConfig = require("../utils/Config");

class PrefixManager {
  constructor(serverModeManager) {
    this.serverModeManager = serverModeManager;
    this.prefixCache = new Map(); // Cache user prefixes for performance
  }

  /**
   * Get user's custom prefix or fall back to global prefix
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID (for server mode detection)
   * @returns {Promise<string>} - User's prefix or global prefix
   */
  async getUserPrefix(userId, guildId) {
    try {
      // Check cache first
      const cacheKey = `${userId}_${guildId}`;
      if (this.prefixCache.has(cacheKey)) {
        const cached = this.prefixCache.get(cacheKey);
        // Cache for 5 minutes
        if (Date.now() - cached.timestamp < 300000) {
          return cached.prefix;
        }
        this.prefixCache.delete(cacheKey);
      }

      // Get user data based on server mode
      const user = await this.serverModeManager.getUserData(userId, guildId);

      let userPrefix = globalConfig.prefix; // Default fallback

      if (user && user.prefix) {
        userPrefix = user.prefix;
      }

      // Cache the result
      this.prefixCache.set(cacheKey, {
        prefix: userPrefix,
        timestamp: Date.now(),
      });

      return userPrefix;
    } catch (error) {
      console.error(`Error getting user prefix for ${userId}:`, error);
      return globalConfig.prefix; // Fallback to global prefix
    }
  }

  /**
   * Set user's custom prefix
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID (for server mode detection)
   * @param {string} newPrefix - New prefix to set
   * @returns {Promise<boolean>} - Success status
   */
  async setUserPrefix(userId, guildId, newPrefix) {
    try {
      // Validate prefix
      if (!this.isValidPrefix(newPrefix)) {
        return false;
      }

      // Get current user data
      let user = await this.serverModeManager.getUserData(userId, guildId);

      if (!user) {
        // Create user if doesn't exist
        user = await this.serverModeManager.saveUserData(userId, guildId, {
          prefix: newPrefix,
        });
      } else {
        // Update existing user
        user.prefix = newPrefix;
        await this.serverModeManager.saveUserData(userId, guildId, user);
      }

      // Clear cache
      const cacheKey = `${userId}_${guildId}`;
      this.prefixCache.delete(cacheKey);

      return true;
    } catch (error) {
      console.error(`Error setting user prefix for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if message starts with user's prefix
   * @param {string} content - Message content
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @returns {Promise<{hasPrefix: boolean, prefix: string, command: string}>}
   */
  async checkPrefix(content, userId, guildId) {
    try {
      const userPrefix = await this.getUserPrefix(userId, guildId);

      // Check if message starts with user's prefix (case insensitive)
      if (content.toLowerCase().startsWith(userPrefix.toLowerCase())) {
        return {
          hasPrefix: true,
          prefix: userPrefix,
          command: content.slice(userPrefix.length).trim(),
        };
      }

      // Also check global prefix as fallback
      if (
        userPrefix !== globalConfig.prefix &&
        content.toLowerCase().startsWith(globalConfig.prefix.toLowerCase())
      ) {
        return {
          hasPrefix: true,
          prefix: globalConfig.prefix,
          command: content.slice(globalConfig.prefix.length).trim(),
        };
      }

      return {
        hasPrefix: false,
        prefix: userPrefix,
        command: "",
      };
    } catch (error) {
      console.error(`Error checking prefix:`, error);
      return {
        hasPrefix: false,
        prefix: globalConfig.prefix,
        command: "",
      };
    }
  }

  /**
   * Validate if prefix is acceptable
   * @param {string} prefix - Prefix to validate
   * @returns {boolean} - Is valid
   */
  isValidPrefix(prefix) {
    // Basic validation rules
    if (!prefix || typeof prefix !== "string") return false;
    if (prefix.length > 5) return false; // Max 5 characters
    if (prefix.length < 1) return false; // Min 1 character

    // Prevent certain characters that could cause issues
    const invalidChars = ["@", "#", "`", "\n", "\r", "\t"];
    if (invalidChars.some((char) => prefix.includes(char))) return false;

    // Prevent only whitespace
    if (prefix.trim().length === 0) return false;

    return true;
  }

  /**
   * Get all available prefixes for a user (user + global)
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @returns {Promise<{userPrefix: string, globalPrefix: string}>}
   */
  async getAllPrefixes(userId, guildId) {
    const userPrefix = await this.getUserPrefix(userId, guildId);
    return {
      userPrefix: userPrefix,
      globalPrefix: globalConfig.prefix,
    };
  }

  /**
   * Clear prefix cache for a user
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   */
  clearCache(userId, guildId) {
    const cacheKey = `${userId}_${guildId}`;
    this.prefixCache.delete(cacheKey);
  }

  /**
   * Clear all prefix cache
   */
  clearAllCache() {
    this.prefixCache.clear();
  }
}

module.exports = PrefixManager;

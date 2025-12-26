const GuildMessages = require('../schemas/guildMessages');

class GuildMessagesUtil {
    /**
     * Track a message in the guild statistics
     * @param {string} guildId - The guild ID
     * @param {string} channelId - The channel ID
     * @param {string} userId - The user ID
     * @returns {Promise<Object>} Updated guild message document
     */
    static async trackMessage(guildId, channelId, userId) {
        try {
            const now = new Date();
            const hour = now.getHours();

            // Update main guild message counts
            await GuildMessages.findOneAndUpdate(
                { guildId },
                {
                    $inc: {
                        totalMessages: 1,
                        'messageCount.daily': 1,
                        'messageCount.weekly': 1,
                        'messageCount.monthly': 1,
                    },
                    $set: {
                        'statistics.lastMessageAt': now,
                        'statistics.peakHour': hour,
                    },
                },
                { upsert: true, new: false }
            );

            // Update channel stats
            await GuildMessages.updateOne(
                { guildId, 'channelStats.channelId': channelId },
                {
                    $inc: { 'channelStats.$.messageCount': 1 },
                    $set: { 'channelStats.$.lastMessageAt': now },
                }
            );

            // Add channel if it doesn't exist
            await GuildMessages.updateOne(
                { guildId, 'channelStats.channelId': { $ne: channelId } },
                {
                    $push: {
                        channelStats: { channelId, messageCount: 1, lastMessageAt: now },
                    },
                }
            );

            // Update user stats
            await GuildMessages.updateOne(
                { guildId, 'userStats.userId': userId },
                {
                    $inc: { 'userStats.$.messageCount': 1 },
                    $set: { 'userStats.$.lastMessageAt': now },
                }
            );

            // Add user if doesn't exist
            await GuildMessages.updateOne(
                { guildId, 'userStats.userId': { $ne: userId } },
                {
                    $push: {
                        userStats: { userId, messageCount: 1, lastMessageAt: now },
                    },
                }
            );

            return { success: true };
        } catch (error) {
            console.error('Error tracking guild messages:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get guild message statistics
     * @param {string} guildId - The guild ID
     * @returns {Promise<Object|null>} Guild message document or null
     */
    static async getGuildStats(guildId) {
        try {
            return await GuildMessages.findOne({ guildId });
        } catch (error) {
            console.error('Error fetching guild stats:', error);
            return null;
        }
    }

    /**
     * Get top message users in a guild
     * @param {string} guildId - The guild ID
     * @param {number} limit - Number of top users to return (default: 10)
     * @returns {Promise<Array>} Top users sorted by message count
     */
    static async getTopUsers(guildId, limit = 10) {
        try {
            const stats = await GuildMessages.findById(guildId);
            if (!stats || !stats.userStats) return [];

            return stats.userStats.sort((a, b) => b.messageCount - a.messageCount).slice(0, limit);
        } catch (error) {
            console.error('Error fetching top users:', error);
            return [];
        }
    }

    /**
     * Get top message channels in a guild
     * @param {string} guildId - The guild ID
     * @param {number} limit - Number of top channels to return (default: 10)
     * @returns {Promise<Array>} Top channels sorted by message count
     */
    static async getTopChannels(guildId, limit = 10) {
        try {
            const stats = await GuildMessages.findById(guildId);
            if (!stats || !stats.channelStats) return [];

            return stats.channelStats.sort((a, b) => b.messageCount - a.messageCount).slice(0, limit);
        } catch (error) {
            console.error('Error fetching top channels:', error);
            return [];
        }
    }

    /**
     * Reset daily/weekly/monthly counts
     * @param {string} guildId - The guild ID
     * @param {string} period - 'daily', 'weekly', or 'monthly'
     * @returns {Promise<boolean>} Success status
     */
    static async resetPeriodCount(guildId, period) {
        try {
            const validPeriods = ['daily', 'weekly', 'monthly'];
            if (!validPeriods.includes(period)) {
                console.warn(`Invalid period: ${period}`);
                return false;
            }

            await GuildMessages.findOneAndUpdate(
                { guildId },
                {
                    $set: {
                        [`messageCount.${period}`]: 0,
                        'statistics.lastResetAt': new Date(),
                    },
                }
            );

            return true;
        } catch (error) {
            console.error(`Error resetting ${period} count:`, error);
            return false;
        }
    }
}

module.exports = GuildMessagesUtil;

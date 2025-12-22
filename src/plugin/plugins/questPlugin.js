/**
 * @name Quest Notifier Plugin
 * @version 1.0.0
 * @description Discord Quest Notifier system plugin that checks for new quests and notifies guilds
 */

const { initializeQuestScheduler } = require('../../utils/questScheduler');

const questPlugin = {
    name: 'Quest Notifier',
    version: '1.0.0',
    author: 'Peachy Bot',
    description: 'Discord Quest Notifier system',

    /**
     * Initialize the quest plugin
     * @param {PeachyClient} client - The Discord client
     */
    initialize: (client) => {
        try {
            // Check if required environment variables are set
            if (!process.env.DISCORD_QUEST_API_URLS) {
                client.logger.warn('⏰ [QuestPlugin] DISCORD_QUEST_API_URLS not set. Quest notifier will be disabled.');
                client.logger.info(
                    '⏰ [QuestPlugin] To enable, set DISCORD_QUEST_API_URLS environment variable with comma-separated API URLs.'
                );
                return;
            }

            // Schedule the quest checker on client ready
            client.once('clientReady', () => {
                try {
                    initializeQuestScheduler(client);
                    client.logger.info('⏰ [QuestPlugin] Quest scheduler initialized');
                } catch (error) {
                    client.logger.error('⏰ [QuestPlugin] Failed to initialize quest scheduler:', error);
                }
            });

            client.logger.info('⏰ [QuestPlugin] Quest Notifier plugin loaded');
        } catch (error) {
            client.logger.error('⏰ [QuestPlugin] Plugin initialization error:', error);
        }
    },
};

module.exports = questPlugin;

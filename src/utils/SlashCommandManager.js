/**
 * @namespace: utils/SlashCommandManager.js
 * @type: Utility
 * @description Manages automatic slash command registration/reload with Discord API
 */

const { REST, Routes } = require('discord.js');

class SlashCommandManager {
    constructor(client) {
        this.client = client;
        this.logger = client.logger;
        this.config = client.config;
    }

    /**
     * Register or update all slash commands with Discord
     * @param {Array} commandData - Array of command data objects from client.body
     * @returns {Promise<void>}
     */
    async registerCommands(commandData) {
        try {
            if (!commandData || commandData.length === 0) {
                this.logger.warn('❌ No commands to register');
                return;
            }

            this.logger.info(`📝 Registering ${commandData.length} slash commands...`);

            const rest = new REST({ version: '10' }).setToken(this.config.token);

            // Get guild ID from config (if doing guild-specific commands for testing)
            const testGuildId = this.config.testGuildId;

            // Fetch existing commands to preserve Entry Point commands
            let existingCommands = [];
            try {
                existingCommands = await rest.get(Routes.applicationCommands(this.config.clientId));
            } catch (err) {
                this.logger.warn(`⚠️ Could not fetch existing commands: ${err.message}`);
            }

            // Find and preserve Entry Point commands (Discord-specific commands that shouldn't be removed)
            const entryPointCommands = existingCommands.filter((cmd) => cmd.integration_types && cmd.integration_types.includes(1));

            // Create a Set of command names from commandData to check for duplicates
            const commandDataNames = new Set(commandData.map((cmd) => cmd.name));

            // Only add Entry Point commands that aren't already in commandData (avoid duplicates)
            const uniqueEntryPointCommands = entryPointCommands.filter((cmd) => !commandDataNames.has(cmd.name));

            // Combine new commands with preserved Entry Point commands
            const commandsToRegister = [...commandData, ...uniqueEntryPointCommands];

            // Register commands globally (can take up to 1 hour to propagate)
            await rest.put(Routes.applicationCommands(this.config.clientId), { body: commandsToRegister });

            this.logger.info(`✅ Successfully registered ${commandData.length} global slash commands!`);
        } catch (error) {
            this.logger.error('❌ Failed to register slash commands:', error);
            throw error;
        }
    }

    /**
     * Fetch current slash commands from Discord
     * @returns {Promise<Array>} Array of current commands on Discord
     */
    async fetchCurrentCommands() {
        try {
            const rest = new REST({ version: '10' }).setToken(this.config.token);
            const commands = await rest.get(Routes.applicationCommands(this.config.clientId));
            return commands;
        } catch (error) {
            this.logger.error('❌ Failed to fetch current commands:', error);
            return [];
        }
    }

    /**
     * Compare local commands with Discord commands and log differences
     * @param {Array} localCommands - Commands from client.body
     * @param {Array} discordCommands - Commands from Discord API
     * @returns {Promise<void>}
     */
    async compareCommands(localCommands, discordCommands) {
        try {
            const localNames = new Set(localCommands.map((cmd) => cmd.name));
            const discordNames = new Set(discordCommands.map((cmd) => cmd.name));

            // Find new commands
            const newCommands = [...localNames].filter((name) => !discordNames.has(name));

            // Find removed commands
            const removedCommands = [...discordNames].filter((name) => !localNames.has(name));

            if (newCommands.length > 0) {
                this.logger.info(`🆕 New commands to add: ${newCommands.join(', ')}`);
            }

            if (removedCommands.length > 0) {
                this.logger.info(`🗑️ Commands to remove: ${removedCommands.join(', ')}`);
            }

            if (newCommands.length === 0 && removedCommands.length === 0) {
                this.logger.info(`✅ All commands are up to date!`);
            }
        } catch (error) {
            this.logger.error('Error comparing commands:', error);
        }
    }

    /**
     * Clear all slash commands from Discord (useful for cleanup)
     * @returns {Promise<void>}
     */
    async clearAllCommands() {
        try {
            this.logger.warn('⚠️  Clearing all slash commands...');

            const rest = new REST({ version: '10' }).setToken(this.config.token);

            await rest.put(Routes.applicationCommands(this.config.clientId), { body: [] });

            this.logger.info('✅ All slash commands cleared!');
        } catch (error) {
            this.logger.error('❌ Failed to clear commands:', error);
            throw error;
        }
    }

    /**
     * Full sync: Register commands and verify they're synced
     * @param {Array} commandData - Array of command data objects
     * @returns {Promise<void>}
     */
    async syncCommands(commandData) {
        try {
            this.logger.info('🔄 Starting slash command sync...');

            // Register the commands
            await this.registerCommands(commandData);

            // Wait a moment for Discord to process
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Fetch what Discord has now
            const currentCommands = await this.fetchCurrentCommands();

            // Compare and show differences
            await this.compareCommands(commandData, currentCommands);

            this.logger.info('✅ Slash command sync complete!');
        } catch (error) {
            this.logger.error('❌ Slash command sync failed:', error);
            throw error;
        }
    }
}

module.exports = SlashCommandManager;

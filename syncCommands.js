#!/usr/bin/env node

/**
 * @name syncCommands.js
 * @description Manual script to sync slash commands with Discord
 * Usage: node syncCommands.js [--clear]
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { REST, Routes } = require('discord.js');

const config = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    testGuildId: process.env.TEST_GUILD_ID,
};

// Validate config
if (!config.token) {
    console.error('❌ Error: TOKEN not found in .env file');
    process.exit(1);
}

if (!config.clientId) {
    console.error('❌ Error: CLIENT_ID not found in .env file');
    process.exit(1);
}

console.log('📝 Slash Command Sync Tool');
console.log('==========================\n');

/**
 * Load commands from the commands directory
 */
function loadCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, './src/commands');

    if (!fs.existsSync(commandsPath)) {
        console.error('❌ Commands directory not found');
        process.exit(1);
    }

    const categories = fs.readdirSync(commandsPath);

    categories.forEach((category) => {
        const categoryPath = path.join(commandsPath, category);
        const stats = fs.statSync(categoryPath);

        if (!stats.isDirectory()) return;

        const files = fs.readdirSync(categoryPath).filter((file) => file.endsWith('.js'));

        files.forEach((file) => {
            try {
                const command = require(path.join(categoryPath, file));

                // Extract slash command data
                if (command.slashCommand && typeof command.slashCommand === 'object') {
                    const data = {
                        name: command.name,
                        description: command.description?.content || 'No description',
                        type: 1, // CHAT_INPUT
                        options: command.options || [],
                        default_member_permissions: command.permissions?.user?.length > 0 ? command.permissions.user : null,
                    };

                    commands.push(data);
                    console.log(`✓ Loaded: ${command.name}`);
                }
            } catch (error) {
                console.error(`✗ Error loading ${file}:`, error.message);
            }
        });
    });

    return commands;
}

/**
 * Register commands with Discord
 */
async function registerCommands(commands) {
    try {
        console.log(`\n📤 Registering ${commands.length} commands with Discord...\n`);

        const rest = new REST({ version: '10' }).setToken(config.token);

        // Register globally
        const globalResult = await rest.put(Routes.applicationCommands(config.clientId), { body: commands });

        console.log(`✅ Successfully registered ${globalResult.length} global commands!`);

        // Also register to test guild if configured (instant update)
        if (config.testGuildId) {
            try {
                const guildResult = await rest.put(Routes.applicationGuildCommands(config.clientId, config.testGuildId), {
                    body: commands,
                });
                console.log(`✅ Also registered ${guildResult.length} commands in test guild (instant)`);
            } catch (err) {
                console.warn(`⚠️ Could not register test guild commands: ${err.message}`);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to register commands:', error.message);
        return false;
    }
}

/**
 * Clear all commands from Discord
 */
async function clearCommands() {
    try {
        console.log('\n🗑️ Clearing all commands from Discord...\n');

        const rest = new REST({ version: '10' }).setToken(config.token);

        // Clear global commands
        await rest.put(Routes.applicationCommands(config.clientId), { body: [] });

        console.log('✅ Successfully cleared all global commands!');

        // Clear guild commands if configured
        if (config.testGuildId) {
            try {
                await rest.put(Routes.applicationGuildCommands(config.clientId, config.testGuildId), { body: [] });
                console.log('✅ Also cleared all commands from test guild');
            } catch (err) {
                console.warn(`⚠️ Could not clear test guild commands: ${err.message}`);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to clear commands:', error.message);
        return false;
    }
}

/**
 * Fetch current commands from Discord
 */
async function fetchCurrentCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(config.token);
        const commands = await rest.get(Routes.applicationCommands(config.clientId));
        return commands;
    } catch (error) {
        console.error('❌ Failed to fetch commands:', error.message);
        return [];
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');

    if (shouldClear) {
        const success = await clearCommands();
        process.exit(success ? 0 : 1);
    }

    console.log('📚 Loading commands...\n');
    const localCommands = loadCommands();

    if (localCommands.length === 0) {
        console.error('\n❌ No commands found to register');
        process.exit(1);
    }

    console.log(`\n✅ Found ${localCommands.length} commands\n`);

    // Fetch current commands
    console.log('🔍 Fetching current commands from Discord...\n');
    const currentCommands = await fetchCurrentCommands();

    // Compare
    const localNames = new Set(localCommands.map((cmd) => cmd.name));
    const discordNames = new Set(currentCommands.map((cmd) => cmd.name));

    const newCommands = [...localNames].filter((name) => !discordNames.has(name));
    const removedCommands = [...discordNames].filter((name) => !localNames.has(name));

    if (newCommands.length > 0) {
        console.log(`🆕 New commands: ${newCommands.join(', ')}`);
    }

    if (removedCommands.length > 0) {
        console.log(`🗑️ Commands to remove: ${removedCommands.join(', ')}`);
    }

    if (newCommands.length === 0 && removedCommands.length === 0) {
        console.log('✅ All commands are up to date!\n');
        process.exit(0);
    }

    // Register
    const success = await registerCommands(localCommands);

    console.log('\n⏱️ Discord may take up to 1 hour to update globally.');
    console.log('💡 Test guild commands are updated instantly.\n');

    process.exit(success ? 0 : 1);
}

// Run
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

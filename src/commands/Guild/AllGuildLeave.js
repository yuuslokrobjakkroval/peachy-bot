const { Command } = require('../../structures/index.js');

module.exports = class AllGuildLeave extends Command {
    constructor(client) {
        super(client, {
            name: 'allguildleave',
            description: {
                content: 'Leave all guilds',
                examples: ['allguildleave'],
                usage: 'allguildleave',
            },
            category: 'guild',
            aliases: ['agl'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // check owner bot
        if (ctx.author.id !== '966688007493140591') return;

        // Fetch all guilds the bot is in
        const guilds = client.guilds.cache;

        // Check if the bot is in any guilds
        if (guilds.size === 0) {
            return client.utils.sendSuccessMessage(client, ctx, 'The bot is not in any guilds.', color);
        }

        // Loop through each guild and leave
        for (const [id, guild] of guilds) {
            try {
                await guild.leave();
                console.log(`Left guild: ${guild.name} (${guild.id})`);
            } catch (error) {
                console.error(`Failed to leave guild: ${guild.name} (${guild.id})`, error);
            }
        }

        // Send a success message
        return client.utils.sendSuccessMessage(client, ctx, 'Left all guilds successfully.', color);
    }
};
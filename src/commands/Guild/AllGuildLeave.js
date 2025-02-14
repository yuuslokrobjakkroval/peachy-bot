const { Command } = require('../../structures/index.js');

module.exports = class AllGuildLeave extends Command {
    constructor(client) {
        super(client, {
            name: 'allguildleave',
            description: {
                content: 'Leave all guilds except a specific one',
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
        // Allow only user with ID 966688007493140591
        if (ctx.author.id !== '966688007493140591') return;

        // Guild ID to exclude
        const excludedGuildId = '1271685844700233738';

        // Fetch all guilds the bot is in
        const guilds = client.guilds.cache.filter(guild => guild.id !== excludedGuildId);

        // Check if there's any guild to leave
        if (guilds.size === 0) {
            return client.utils.sendSuccessMessage(client, ctx, 'No guilds to leave.', color);
        }

        // Send a processing message
        await client.utils.sendSuccessMessage(client, ctx, `Leaving ${guilds.size} guild(s)...`, color);

        let leftGuilds = [];

        // Leave each guild
        for (const guild of guilds.values()) {
            try {
                await guild.leave();
                leftGuilds.push(`- ${guild.name} (${guild.id})`);
            } catch (error) {
                console.error(`Failed to leave guild: ${guild.name} (${guild.id})`, error);
            }
        }

        // Format the list of left guilds
        const leaveMessage = leftGuilds.length > 0
            ? `Left the following guilds:\n${leftGuilds.join('\n')}`
            : 'No guilds were left.';

        // Send final confirmation message
        return client.utils.sendSuccessMessage(client, ctx, leaveMessage, color);
    }
};

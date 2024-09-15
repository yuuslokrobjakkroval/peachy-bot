const { Command } = require('../../structures/index.js');

module.exports = class GuildLeave extends Command {
    constructor(client) {
        super(client, {
            name: 'guildleave',
            description: {
                content: 'Leave a guild',
                examples: ['guildleave'],
                usage: 'guildleave',
            },
            category: 'developer',
            aliases: ['gl'],
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

    async run(client, ctx, args) {
        const guild = this.client.guilds.cache.get(args[0]);
        if (!guild) return await ctx.sendMessage('Guild not found');

        await guild.leave();
        ctx.sendMessage(`Left guild ${guild.name}`);
    }
};

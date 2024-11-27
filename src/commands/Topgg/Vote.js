const { Command } = require('../../structures/index.js');

module.exports = class Vote extends Command {
    constructor(client) {
        super(client, {
            name: 'vote',
            description: {
                content: 'Sets up a webhook listener for top.gg votes.',
                examples: ['vote'],
                usage: 'vote',
            },
            category: 'topgg',
            aliases: ['vote'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        await ctx.send('Webhook listener is set up on your bot. You do not need to manually trigger this command.');
    }
};

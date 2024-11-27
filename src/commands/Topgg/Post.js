const { Command } = require('../../structures/index.js');
const { AutoPoster } = require('topgg-autoposter');

module.exports = class Post extends Command {
    constructor(client) {
        super(client, {
            name: 'post',
            description: {
                content: 'Set up AutoPoster for top.gg and confirm its status.',
                examples: ['post autoposter'],
                usage: 'post autoposter',
            },
            category: 'topgg',
            aliases: ['post'],
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
        await ctx.sendDeferMessage('Thinking...');

        const ap = AutoPoster(process.env.TOPGG_TOKEN, client);
        let content = '';

        ap.on('posted', () => {
            content = `${emoji.tick || '✅'} AutoPoster is active and automatically posting stats to top.gg every 30 minutes!`;
            ctx.editMessage({ content });
        });

        ap.on('error', (error) => {
            content = `Error posting stats to top.gg: ${error.message || 'Unknown error'}`;
            ctx.editMessage({ content });
        });
    }
};

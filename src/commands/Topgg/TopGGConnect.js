const { Command } = require('../../structures/index.js');
const { AutoPoster } = require('topgg-autoposter');

module.exports = class TopGGConnect extends Command {
    constructor(client) {
        super(client, {
            name: 'topgg',
            description: {
                content: 'Set up AutoPoster for top.gg and confirm its status.',
                examples: ['topgg autoposter'],
                usage: 'topgg autoposter',
            },
            category: 'developer',
            aliases: ['topggstats', 'topstats'],
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
        const TOPGG_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyNzE2OTM3ODg1NDg0MzYwMDgiLCJib3QiOnRydWUsImlhdCI6MTczMjYyMjI2OH0.Y3Js9I3uMbcJ1mhKymbUVhAlxgGLu-XJ8QZmMzY2p5A'; // Replace with your actual token.
        const ap = AutoPoster(TOPGG_API_TOKEN, client);
        let  content;
        // Event listeners for success or error handling
        ap.on('posted', () => {
            content = `${emoji.success || '✅'} AutoPoster is active and automatically posting stats to top.gg every 30 minutes!`;
        });

        ap.on('error', () => {
            content = `Error posting stats to top.gg`;
        });

        return await ctx.editMessage({ content: content });
    }
};

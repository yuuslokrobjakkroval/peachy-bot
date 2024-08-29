const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Blush extends Command {
    constructor(client) {
        super(client, {
            name: 'blush',
            description: {
                content: 'Sends a cute blush anime action.',
                examples: ['blush'],
                usage: 'blush',
            },
            category: 'actions',
            aliases: ['shy'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx) {
        try {
            const blushGif = await Anime.blush();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${ctx.author.displayName} is blushing! 😳💖`)
                        .setImage(blushGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch blush GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the blush GIF.' });
        }
    }
};

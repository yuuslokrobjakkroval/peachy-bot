const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Giggle extends Command {
    constructor(client) {
        super(client, {
            name: 'giggle',
            description: {
                content: 'Sends a cute giggling anime action.',
                examples: ['giggle', 'laugh', 'chuckle'],
                usage: 'giggle',
            },
            category: 'actions',
            aliases: ['laugh', 'chuckle'],
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
            const giggleGif = await Anime.giggle();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${ctx.author.displayName} giggles! 😆✨`)
                        .setImage(giggleGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch giggle GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the giggle GIF.' });
        }
    }
};

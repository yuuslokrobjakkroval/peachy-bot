const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Wink extends Command {
    constructor(client) {
        super(client, {
            name: 'wink',
            description: {
                content: 'Sends a playful wink.',
                examples: ['wink'],
                usage: 'wink',
            },
            category: 'emotes',
            aliases: [],
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
        const winkGif = await Anime.wink();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`😉 Wink 😉`)
            .setImage(winkGif)
            .setDescription('Just a little wink to make your day brighter!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

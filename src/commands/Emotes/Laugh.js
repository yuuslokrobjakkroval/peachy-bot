const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Laugh extends Command {
    constructor(client) {
        super(client, {
            name: 'laugh',
            description: {
                content: 'Expresses joy with laughter.',
                examples: ['laugh'],
                usage: 'laugh',
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
        const laughGif = await Anime.laugh();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`😂 Laughing 😂`)
            .setImage(laughGif)
            .setDescription('Something really tickled your funny bone!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

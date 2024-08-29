const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Smile extends Command {
    constructor(client) {
        super(client, {
            name: 'smile',
            description: {
                content: 'Sends a warm smile.',
                examples: ['smile'],
                usage: 'smile',
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
        const smileGif = await Anime.smile();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`😊 Smile 😊`)
            .setImage(smileGif)
            .setDescription('A smile can brighten anyone\'s day!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

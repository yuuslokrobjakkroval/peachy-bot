const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class ThumbsUp extends Command {
    constructor(client) {
        super(client, {
            name: 'thumbsup',
            description: {
                content: 'Gives a thumbs up to express approval or agreement.',
                examples: ['thumbsup'],
                usage: 'thumbsup',
            },
            category: 'emotes',
            aliases: ['approve'],
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
        const thumbsUpGif = await Anime.thumbsUp();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`👍 Thumbs Up 👍`)
            .setImage(thumbsUpGif)
            .setDescription('Good job! Keep it up!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

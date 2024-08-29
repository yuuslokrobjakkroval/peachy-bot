const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Dance extends Command {
    constructor(client) {
        super(client, {
            name: 'dance',
            description: {
                content: 'Shows off some dance moves!',
                examples: ['dance'],
                usage: 'dance',
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
        const danceGif = await Anime.dance();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`🕺 Dancing Time! 💃`)
            .setImage(danceGif)
            .setDescription('Let\'s dance the night away!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

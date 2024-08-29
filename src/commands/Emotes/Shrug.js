const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Shrug extends Command {
    constructor(client) {
        super(client, {
            name: 'shrug',
            description: {
                content: 'Expresses indifference or confusion.',
                examples: ['shrug'],
                usage: 'shrug',
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
        const shrugGif = await Anime.shrug();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`🤷 Shrug 🤷`)
            .setImage(shrugGif)
            .setDescription('Sometimes, you just don\'t know!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

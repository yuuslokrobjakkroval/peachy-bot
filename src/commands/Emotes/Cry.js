const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Cry extends Command {
    constructor(client) {
        super(client, {
            name: 'cry',
            description: {
                content: 'Expresses sadness with a crying emote.',
                examples: ['cry'],
                usage: 'cry',
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
        const cryGif = await Anime.cry();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`😢 Crying 😢`)
            .setImage(cryGif)
            .setDescription('Sometimes, you just need to let it out...');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

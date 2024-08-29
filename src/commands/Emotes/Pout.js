const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Pout extends Command {
    constructor(client) {
        super(client, {
            name: 'pout',
            description: {
                content: 'Expresses mild frustration or displeasure with a pout.',
                examples: ['pout'],
                usage: 'pout',
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
        const poutGif = await Anime.pout();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`😡 Pout 😡`)
            .setImage(poutGif)
            .setDescription('Hmph! I’m not happy about this...');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

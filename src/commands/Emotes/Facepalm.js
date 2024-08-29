const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Facepalm extends Command {
    constructor(client) {
        super(client, {
            name: 'facepalm',
            description: {
                content: 'Expresses frustration or disbelief with a facepalm.',
                examples: ['facepalm'],
                usage: 'facepalm',
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
        const facepalmGif = await Anime.facepalm();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`🤦 Facepalm 🤦`)
            .setImage(facepalmGif)
            .setDescription('When words just aren’t enough to express your frustration...');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

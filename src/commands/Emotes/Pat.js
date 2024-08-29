const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Pat extends Command {
    constructor(client) {
        super(client, {
            name: 'pat',
            description: {
                content: 'Gently pats someone’s head to show affection.',
                examples: ['pat'],
                usage: 'pat',
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
        const patGif = await Anime.pat();

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`💖 Pat 💖`)
            .setImage(patGif)
            .setDescription('There, there... you deserve some affection!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

const Command = require('../../structures/Command.js');

module.exports = class Kawaii extends Command {
    constructor(client) {
        super(client, {
            name: 'kawaii',
            description: {
                content: 'Sends a kawaii anime-themed message.',
                examples: ['kawaii'],
                usage: 'kawaii',
            },
            category: 'fun',
            aliases: ['cutemsg', 'cuteanime'],
            cooldown: 3,
            args: false,
            player: {
                voice: false,
                dj: false,
                active: false,
                djPerm: null,
            },
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
        const message = `🌸✨ Kawaii! You are as cute as an anime character! 😍💕`;

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`💖 Kawaii Anime Message 💖`)
            .setDescription(message);

        await ctx.sendMessage({ embeds: [embed] });
    }
};

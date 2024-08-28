const Command = require('../../structures/Command.js');

module.exports = class Giggle extends Command {
    constructor(client) {
        super(client, {
            name: 'giggle',
            description: {
                content: 'Sends a cute giggling message.',
                examples: ['giggle'],
                usage: 'giggle',
            },
            category: 'anime-actions',
            aliases: ['laugh', 'chuckle'],
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
        const message = `😆✨ Hehe~ That was so funny! You always make me giggle! 😁💕`;

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`💖 Giggle 💖`)
            .setDescription(message);

        await ctx.sendMessage({ embeds: [embed] });
    }
};

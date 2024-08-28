const Command = require('../../structures/Command.js');

module.exports = class Blush extends Command {
    constructor(client) {
        super(client, {
            name: 'blush',
            description: {
                content: 'Sends a cute blushing message.',
                examples: ['blush'],
                usage: 'blush',
            },
            category: 'anime-actions',
            aliases: ['shy'],
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
        const message = `😊🌸 Oh my! You're making me blush! 😳💖`;

        const embed = this.client
            .embed()
            .setColor(this.client.color.main)
            .setTitle(`💖 Blush 💖`)
            .setDescription(message);

        await ctx.sendMessage({ embeds: [embed] });
    }
};

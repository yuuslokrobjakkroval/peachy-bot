const { Command } = require('../../structures/index.js');

module.exports = class Shower extends Command {
    constructor(client) {
        super(client, {
            name: 'shower',
            description: {
                content: 'Show off a feeling of taking a shower!',
                examples: ['shower'],
                usage: 'shower',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.shower);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Shower Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Enjoy a refreshing shower!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

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

    async run(client, ctx, args, color, emoji, language) {
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.shower);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Shower Time! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Enjoy a refreshing shower!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

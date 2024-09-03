const { Command } = require('../../structures/index.js');

module.exports = class Downfall extends Command {
    constructor(client) {
        super(client, {
            name: 'downfall',
            description: {
                content: 'Show off a feeling of downfall or being down.',
                examples: ['downfall'],
                usage: 'downfall',
            },
            category: 'emotes',
            aliases: ['fd', 'df'],
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.downfall); // Ensure this is the correct category
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Feeling Down... ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Express your feelings of downfall.');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

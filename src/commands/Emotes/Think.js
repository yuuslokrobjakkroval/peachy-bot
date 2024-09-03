const { Command } = require('../../structures/index.js');

module.exports = class Think extends Command {
    constructor(client) {
        super(client, {
            name: 'think',
            description: {
                content: 'Show a thoughtful or pondering expression.',
                examples: ['think'],
                usage: 'think',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.think);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Thinking Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Take a moment to ponder or reflect on something.');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

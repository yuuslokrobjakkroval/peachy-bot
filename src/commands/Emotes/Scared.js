const { Command } = require('../../structures/index.js');

module.exports = class Scare extends Command {
    constructor(client) {
        super(client, {
            name: 'scare',
            description: {
                content: 'Show off a feeling of being scared!',
                examples: ['scare'],
                usage: 'scare',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.scared);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Scared! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show your scared side!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

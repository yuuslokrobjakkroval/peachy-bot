const { Command } = require('../../structures/index.js');

module.exports = class Sad extends Command {
    constructor(client) {
        super(client, {
            name: 'sad',
            description: {
                content: 'Express a feeling of sadness.',
                examples: ['sad'],
                usage: 'sad',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.sad);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Feeling Sad ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Sometimes we all need to express our sadness.');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

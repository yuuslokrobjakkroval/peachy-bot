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

    async run(client, ctx, args, color, emoji, language) {
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.sad);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Feeling Sad ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Sometimes we all need to express our sadness.');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

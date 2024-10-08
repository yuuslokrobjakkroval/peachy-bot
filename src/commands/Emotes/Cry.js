const { Command } = require('../../structures/index.js');

module.exports = class Cry extends Command {
    constructor(client) {
        super(client, {
            name: 'cry',
            description: {
                content: 'Express a feeling of crying.',
                examples: ['cry'],
                usage: 'cry',
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.cry);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Crying Time ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Sometimes, expressing tears is the best way to handle emotions.');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

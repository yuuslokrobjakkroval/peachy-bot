const { Command } = require('../../structures/index.js');

module.exports = class Laugh extends Command {
    constructor(client) {
        super(client, {
            name: 'laugh',
            description: {
                content: 'Express a feeling of laughter.',
                examples: ['laugh'],
                usage: 'laugh',
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.laugh);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Laughing Out Loud! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Share a hearty laugh and spread some joy!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

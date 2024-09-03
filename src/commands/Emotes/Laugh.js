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

    async run(client, ctx) {
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.laugh);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Laughing Out Loud! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Share a hearty laugh and spread some joy!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

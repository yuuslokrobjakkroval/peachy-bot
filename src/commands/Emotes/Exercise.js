const { Command } = require('../../structures/index.js');

module.exports = class Exercise extends Command {
    constructor(client) {
        super(client, {
            name: 'exercise',
            description: {
                content: 'Show off a feeling of exercising!',
                examples: ['exercise'],
                usage: 'exercise',
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.exercise);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Exercise Time! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Get moving and stay fit!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

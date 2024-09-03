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

    async run(client, ctx) {
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.exercise);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Exercise Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Get moving and stay fit!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

const { Command } = require('../../structures/index.js');

module.exports = class Eat extends Command {
    constructor(client) {
        super(client, {
            name: 'eat',
            description: {
                content: 'Show off a feeling of eating!',
                examples: ['eat'],
                usage: 'eat',
            },
            category: 'emotes',
            aliases: ['nham', 'c'],
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.eat);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Eating Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Time to enjoy some delicious food!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

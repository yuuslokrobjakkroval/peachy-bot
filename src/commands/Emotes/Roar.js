const { Command } = require('../../structures/index.js');

const roar = []

module.exports = class Roar extends Command {
    constructor(client) {
        super(client, {
            name: 'roar',
            description: {
                content: 'Let out a mighty roar!',
                examples: ['roar'],
                usage: 'roar',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.roars);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Roar Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Unleash the roar!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

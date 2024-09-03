const { Command } = require('../../structures/index.js');

module.exports = class Makeup extends Command {
    constructor(client) {
        super(client, {
            name: 'makeup',
            description: {
                content: 'Show off some makeup!',
                examples: ['makeup'],
                usage: 'makeup',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.makeUp);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Makeup Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Apply some fabulous makeup and shine bright!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

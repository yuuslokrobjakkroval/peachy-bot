const { Command } = require('../../structures/index.js');

module.exports = class Smile extends Command {
    constructor(client) {
        super(client, {
            name: 'smile',
            description: {
                content: 'Show a smiling face.',
                examples: ['smile'],
                usage: 'smile',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.smile);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Smile Brightly! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your best smile and brighten everyone\'s day!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

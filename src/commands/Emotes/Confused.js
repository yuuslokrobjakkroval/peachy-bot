const { Command } = require('../../structures/index.js');

module.exports = class Confused extends Command {
    constructor(client) {
        super(client, {
            name: 'confused',
            description: {
                content: 'Show off a confused expression with a cool animation!',
                examples: ['confused'],
                usage: 'confused',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.confused);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Confused! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your confused expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

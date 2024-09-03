const { Command } = require('../../structures/index.js');

module.exports = class Angry extends Command {
    constructor(client) {
        super(client, {
            name: 'angry',
            description: {
                content: 'Show off your angriest expression with a fierce animation!',
                examples: ['angry'],
                usage: 'angry',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.angry);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Angry! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your angriest expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

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

    async run(client, ctx, args, color, emoji, language) {
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.angry);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Angry! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your angriest expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

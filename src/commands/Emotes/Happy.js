const { Command } = require('../../structures/index.js');

module.exports = class Happy extends Command {
    constructor(client) {
        super(client, {
            name: 'happy',
            description: {
                content: 'Show off a feeling of happiness!',
                examples: ['happy'],
                usage: 'happy',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.happy);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Happy Vibes! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Spread some joy and happiness!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

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

    async run(client, ctx, args, color, emoji, language) {
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.happy);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Happy Vibes! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Spread some joy and happiness!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

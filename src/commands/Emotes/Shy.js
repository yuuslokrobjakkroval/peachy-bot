const { Command } = require('../../structures/index.js');

module.exports = class Shy extends Command {
    constructor(client) {
        super(client, {
            name: 'shy',
            description: {
                content: 'Show off a shy expression with a cute animation!',
                examples: ['shy'],
                usage: 'shy',
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.shy);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Shy! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your shy expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

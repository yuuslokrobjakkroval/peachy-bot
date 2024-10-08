const { Command } = require('../../structures/index.js');

module.exports = class Cute extends Command {
    constructor(client) {
        super(client, {
            name: 'cute',
            description: {
                content: 'Show off your cutest expression with an adorable animation!',
                examples: ['cute'],
                usage: 'cute',
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.cute);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Cute! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your cutest expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

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

    async run(client, ctx) {
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.cute);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Cute! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your cutest expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

const { Command } = require('../../structures/index.js');

module.exports = class Bleh extends Command {
    constructor(client) {
        super(client, {
            name: 'bleh',
            description: {
                content: 'Show off a bleh expression with a cool animation!',
                examples: ['bleh'],
                usage: 'bleh',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.bleh);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Bleh! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your bleh expression!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

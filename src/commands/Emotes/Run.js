const { Command } = require('../../structures/index.js');

module.exports = class Run extends Command {
    constructor(client) {
        super(client, {
            name: 'run',
            description: {
                content: 'Show off your running skills with a cool animation!',
                examples: ['run'],
                usage: 'run',
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
        const randomEmoji = client.utils.getRandomElement(client.emoji.emotes.run);
        const embed = this.client
            .embed()
            .setColor(client.color.main)
            .setTitle(`${client.emoji.mainLeft} Running Time! ${client.emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Show off your running skills!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

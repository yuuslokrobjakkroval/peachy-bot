const { Command } = require('../../structures/index.js');

module.exports = class Dance extends Command {
    constructor(client) {
        super(client, {
            name: 'dance',
            description: {
                content: 'Shows off some dance moves!',
                examples: ['dance'],
                usage: 'dance',
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.dances);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Dancing Time! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Let\'s dance the night away!');


        await ctx.sendMessage({ embeds: [embed] });

    }
};

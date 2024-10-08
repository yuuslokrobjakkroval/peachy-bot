const { Command } = require('../../structures/index.js');

module.exports = class Eat extends Command {
    constructor(client) {
        super(client, {
            name: 'nham',
            description: {
                content: 'Show off a feeling of eating!',
                examples: ['nham'],
                usage: 'nham',
            },
            category: 'emotes',
            aliases: ['c'],
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
        const randomEmoji = client.utils.getRandomElement(emoji.emotes.eat);
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Eating Time! ${emoji.mainRight}`)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription('Time to enjoy some delicious food!');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

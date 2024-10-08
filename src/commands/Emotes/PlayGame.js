const { Command } = require('../../structures/index.js');

module.exports = class PlayGame extends Command {
    constructor(client) {
        super(client, {
            name: 'playgame',
            description: {
                content: 'Show an emote related to playing a game!',
                examples: ['playgame'],
                usage: 'playgame',
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
        const randomEmote = client.utils.getRandomElement(emoji.emotes.playing);
        const emoteImageUrl = client.utils.emojiToImage(randomEmote);

        const embed = this.client
            .embed()
            .setColor(color.main)
            .setTitle(`${emoji.mainLeft} Game Time! ${emoji.mainRight}`)
            .setImage(emoteImageUrl)
            .setDescription('Get ready to play! Here\'s an emote to get you in the game mood.');

        await ctx.sendMessage({ embeds: [embed] });
    }
};

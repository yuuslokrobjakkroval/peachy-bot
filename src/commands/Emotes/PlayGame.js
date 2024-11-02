const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

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
        const playGameMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.playGameMessages;

        try {
            const randomEmote = client.utils.getRandomElement(emoji.emotes ? emoji.emotes.playing : globalEmoji.emotes.playing);
            const emoteImageUrl = client.utils.emojiToImage(randomEmote);

            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(playGameMessages.title) // Use localized title
                .setImage(emoteImageUrl)
                .setDescription(playGameMessages.description.replace('{{user}}', ctx.author.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing play game command:', error);
            return await client.utils.sendErrorMessage(client, ctx, playGameMessages.error, color); // Use localized error message
        }
    }
};

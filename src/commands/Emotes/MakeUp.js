const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Makeup extends Command {
    constructor(client) {
        super(client, {
            name: 'makeup',
            description: {
                content: 'Show off some makeup!',
                examples: ['makeup'],
                usage: 'makeup',
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
        const makeupMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.makeupMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes ? emoji.emotes.makeUp : globalEmoji.emotes.makeUp);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(makeupMessages.title) // Use localized title
                .setDescription(makeupMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random makeup emoji image

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing makeup command:', error);
            return await client.utils.sendErrorMessage(client, ctx, makeupMessages.error, color); // Use localized error message
        }
    }
};

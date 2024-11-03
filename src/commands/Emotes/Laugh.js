const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Laugh extends Command {
    constructor(client) {
        super(client, {
            name: 'laugh',
            description: {
                content: 'Express a feeling of laughter.',
                examples: ['laugh'],
                usage: 'laugh',
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
        const laughMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.laughMessages; // Access localized messages

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes && emoji.emotes.laugh ? emoji.emotes.laugh : globalEmoji.emotes.laugh); // Get a random laugh emoji
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(laughMessages.title) // Use localized title
                .setDescription(laughMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random laugh emoji image

            await ctx.sendMessage({ embeds: [embed] }); // Send the embed message
        } catch (error) {
            console.error('Error processing laugh command:', error);
            return await client.utils.sendErrorMessage(client, ctx, laughMessages.error, color); // Use localized error message
        }
    }
};

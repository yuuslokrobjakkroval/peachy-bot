const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Happy extends Command {
    constructor(client) {
        super(client, {
            name: 'happy',
            description: {
                content: 'Show off a feeling of happiness!',
                examples: ['happy'],
                usage: 'happy',
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
        const happyMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.happyMessages; // Access localized messages

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes && emoji.emotes.happy ? emoji.emotes.happy : globalEmoji.emotes.happy); // Get a random happy emoji
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(happyMessages.title) // Use localized title
                .setDescription(happyMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random happy emoji image

            await ctx.sendMessage({ embeds: [embed] }); // Send the embed message
        } catch (error) {
            console.error('Error processing happy command:', error);
            return await client.utils.sendErrorMessage(client, ctx, happyMessages.error, color); // Use localized error message
        }
    }
};

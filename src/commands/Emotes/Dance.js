const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

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
        const danceMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.danceMessages; // Access localized messages

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes && emoji.emotes.dances ? emoji.emotes.dances : globalEmoji.emotes.dances); // Get a random dance emoji
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(danceMessages.title) // Use localized title
                .setDescription(danceMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random dance emoji image

            await ctx.sendMessage({ embeds: [embed] }); // Send the embed message
        } catch (error) {
            console.error('Error processing dance command:', error);
            return await client.utils.sendErrorMessage(client, ctx, danceMessages.error, color); // Use localized error message
        }
    }
};

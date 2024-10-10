const { Command } = require('../../structures/index.js');

module.exports = class Exercise extends Command {
    constructor(client) {
        super(client, {
            name: 'exercise',
            description: {
                content: 'Show off a feeling of exercising!',
                examples: ['exercise'],
                usage: 'exercise',
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
        const exerciseMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.exerciseMessages; // Access localized messages

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes.exercise); // Get a random exercise emoji
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(exerciseMessages.title) // Use localized title
                .setDescription(exerciseMessages.description, { // Use localized description
                    user: ctx.author.displayName
                })
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random exercise emoji image

            await ctx.sendMessage({ embeds: [embed] }); // Send the embed message
        } catch (error) {
            console.error('Error processing exercise command:', error);
            return await client.utils.sendErrorMessage(client, ctx, exerciseMessages.error, color); // Use localized error message
        }
    }
};

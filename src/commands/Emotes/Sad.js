const { Command } = require('../../structures/index.js');

module.exports = class Sad extends Command {
    constructor(client) {
        super(client, {
            name: 'sad',
            description: {
                content: 'Express a feeling of sadness.',
                examples: ['sad'],
                usage: 'sad',
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
        const sadMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.sadMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes.sad);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(sadMessages.title) // Use localized title
                .setImage(client.utils.emojiToImage(randomEmoji)) // Set random sad emoji image
                .setDescription(sadMessages.description, { // Use localized description
                    user: ctx.author.displayName
                });

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing sad command:', error);
            return await client.utils.sendErrorMessage(client, ctx, sadMessages.error, color); // Use localized error message
        }
    }
};

const { Command } = require('../../structures/index.js');

module.exports = class Shy extends Command {
    constructor(client) {
        super(client, {
            name: 'shy',
            description: {
                content: 'Show off a shy expression with a cute animation!',
                examples: ['shy'],
                usage: 'shy',
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
        const shyMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.shyMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes.shy);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(shyMessages.title) // Use localized title
                .setImage(client.utils.emojiToImage(randomEmoji)) // Set random shy emoji image
                .setDescription(shyMessages.description, { // Use localized description
                    user: ctx.author.displayName
                });

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing shy command:', error);
            return await client.utils.sendErrorMessage(client, ctx, shyMessages.error, color); // Use localized error message
        }
    }
};

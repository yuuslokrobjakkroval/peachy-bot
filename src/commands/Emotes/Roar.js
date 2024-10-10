const { Command } = require('../../structures/index.js');

module.exports = class Roar extends Command {
    constructor(client) {
        super(client, {
            name: 'roar',
            description: {
                content: 'Let out a mighty roar!',
                examples: ['roar'],
                usage: 'roar',
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
        const roarMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.roarMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes.roars);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(roarMessages.title) // Use localized title
                .setImage(client.utils.emojiToImage(randomEmoji)) // Set random roar emoji image
                .setDescription(roarMessages.description.replace('{{user}}', ctx.author.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing roar command:', error);
            return await client.utils.sendErrorMessage(client, ctx, roarMessages.error, color); // Use localized error message
        }
    }
};

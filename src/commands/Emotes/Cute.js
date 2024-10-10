const { Command } = require('../../structures/index.js');

module.exports = class Cute extends Command {
    constructor(client) {
        super(client, {
            name: 'cute',
            description: {
                content: 'Show off your cutest expression with an adorable animation!',
                examples: ['cute'],
                usage: 'cute',
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
        const cuteMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.cuteMessages; // Access localized messages

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes.cute); // Get a random cute emoji
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(cuteMessages.title) // Use localized title
                .setDescription(cuteMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random cute emoji image

            await ctx.sendMessage({ embeds: [embed] }); // Send the embed message
        } catch (error) {
            console.error('Error processing cute command:', error);
            return await client.utils.sendErrorMessage(client, ctx, cuteMessages.error, color); // Use localized error message
        }
    }
};

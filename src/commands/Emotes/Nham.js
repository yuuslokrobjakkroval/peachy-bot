const { Command } = require('../../structures/index.js');

module.exports = class Eat extends Command {
    constructor(client) {
        super(client, {
            name: 'nham',
            description: {
                content: 'Show off a feeling of eating!',
                examples: ['nham'],
                usage: 'nham',
            },
            category: 'emotes',
            aliases: ['c'],
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
        const eatMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.eatMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes.eat);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(eatMessages.title) // Use localized title
                .setDescription(eatMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random eat emoji image

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing eat command:', error);
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.error, color); // Use localized error message
        }
    }
};

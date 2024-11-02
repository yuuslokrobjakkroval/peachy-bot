const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Shower extends Command {
    constructor(client) {
        super(client, {
            name: 'shower',
            description: {
                content: 'Show off a feeling of taking a shower!',
                examples: ['shower'],
                usage: 'shower',
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
        const showerMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.showerMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes ? emoji.emotes.shower : globalEmoji.emotes.shower);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(showerMessages.title) // Use localized title
                .setImage(client.utils.emojiToImage(randomEmoji)) // Set random shower emoji image
                .setDescription(showerMessages.description.replace('{{user}}', ctx.author.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing shower command:', error);
            return await client.utils.sendErrorMessage(client, ctx, showerMessages.error, color); // Use localized error message
        }
    }
};

const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Cry extends Command {
    constructor(client) {
        super(client, {
            name: 'cry',
            description: {
                content: 'Express a feeling of crying.',
                examples: ['cry'],
                usage: 'cry',
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
        const cryMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.cryMessages;
        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes ? emoji.emotes.cry : globalEmoji.emotes.cry);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(cryMessages.title) // Use localized title
                .setDescription(cryMessages.description.replace('{{user}}', ctx.author.displayName))

                .setImage(client.utils.emojiToImage(randomEmoji)); // Set random crying emoji image

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing cry command:', error);
            return await client.utils.sendErrorMessage(client, ctx, cryMessages.error, color); // Use localized error message
        }
    }
};

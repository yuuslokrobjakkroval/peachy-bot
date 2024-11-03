const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Scare extends Command {
    constructor(client) {
        super(client, {
            name: 'scare',
            description: {
                content: 'Show off a feeling of being scared!',
                examples: ['scare'],
                usage: 'scare',
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
        const scareMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.scareMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes && emoji.emotes.scared ? emoji.emotes.scared : globalEmoji.emotes.scared);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(scareMessages.title) // Use localized title
                .setImage(client.utils.emojiToImage(randomEmoji)) // Set random scare emoji image
                .setDescription(scareMessages.description.replace('{{user}}', ctx.author.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing scare command:', error);
            return await client.utils.sendErrorMessage(client, ctx, scareMessages.error, color); // Use localized error message
        }
    }
};

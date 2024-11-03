const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Roar extends Command {
    constructor(client) {
        super(client, {
            name: 'run',
            description: {
                content: 'Let out a mighty roar!',
                examples: ['run'],
                usage: 'run',
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
        const runMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.runMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes && emoji.emotes.run ? emoji.emotes.run : globalEmoji.emotes.run);
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(runMessages.title) // Use localized title
                .setImage(client.utils.emojiToImage(randomEmoji)) // Set random roar emoji image
                .setDescription(runMessages.description.replace('{{user}}', ctx.author.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing roar command:', error);
            return await client.utils.sendErrorMessage(client, ctx, runMessages.error, color); // Use localized error message
        }
    }
};

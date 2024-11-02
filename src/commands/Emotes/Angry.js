const { Command } = require('../../structures/index.js');
const globalEmoji = require('../../utils/Emoji');

module.exports = class Angry extends Command {
    constructor(client) {
        super(client, {
            name: 'angry',
            description: {
                content: 'Show off your angriest expression with a fierce animation!',
                examples: ['angry'],
                usage: 'angry',
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
        const angryMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.angryMessages;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes ? emoji.emotes.angry : globalEmoji.emotes.angry);
            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(angryMessages.title)
                .setDescription(angryMessages.description.replace('{{user}}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch angry GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, angryMessages.error, color);
        }
    }

};

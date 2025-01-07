const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Happy extends Command {
    constructor(client) {
        super(client, {
            name: 'happy',
            description: {
                content: '𝑺𝒉𝒐𝒘 𝒐𝒇𝒇 𝒂 𝒇𝒆𝒆𝒍𝒊𝒏𝒈 𝒐𝒇 𝒉𝒂𝒑𝒑𝒊𝒏𝒆𝒔𝒔!',
                examples: ['happy'],
                usage: 'happy',
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

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const happyMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.happyMessages;
        const errorMessages = happyMessages.errors;

        try {
            // Get random happy emoji
            const happyEmoji = emoji.emotes?.happy || globalEmoji.emotes.happy;
            const randomEmoji = client.utils.getRandomElement(happyEmoji);

            // Construct the embed
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', '𝐇𝐀𝐏𝐏𝐘')
                        .replace('%{mainRight}', emoji.mainRight) +
                    happyMessages.description.replace('%{user}', ctx.author.displayName)
                )
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setFooter({
                    text: generalMessages.requestedBy
                        .replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed message
            ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            // Error handling for any unexpected errors
            console.error('An error occurred in the Happy command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

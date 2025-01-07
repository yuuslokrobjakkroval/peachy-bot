const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class PlayGame extends Command {
    constructor(client) {
        super(client, {
            name: 'playgame',
            description: {
                content: '𝑺𝒉𝒐𝒘 𝒂𝒏 𝒆𝒎𝒐𝒕𝒆 𝒓𝒆𝒍𝒂𝒕𝒆𝒅 𝒕𝒐 𝒑𝒍𝒂𝒚𝒊𝒏𝒈 𝒂 𝒈𝒂𝒎𝒆!',
                examples: ['playgame'],
                usage: 'playgame',
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
        const playGameMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.playGameMessages;
        const errorMessages = playGameMessages.errors;

        try {
            // Get random play game emoji
            const playGameEmoji = emoji.emotes?.playing || globalEmoji.emotes.playing;
            const randomEmote = client.utils.getRandomElement(playGameEmoji);
            const emoteImageUrl = client.utils.emojiToImage(randomEmote);

            // Construct the embed with title moved to the description
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐏𝐋𝐀𝐘𝐆𝐀𝐌𝐄")
                        .replace('%{mainRight}', emoji.mainRight) +
                    playGameMessages.description.replace('%{user}', ctx.author.displayName)
                )
                .setImage(emoteImageUrl)
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed message
            ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            // Error handling for any unexpected errors
            console.error('Error processing play game command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Laugh extends Command {
    constructor(client) {
        super(client, {
            name: 'laugh',
            description: {
                content: '𝑬𝒙𝒑𝒓𝒆𝒔𝒔 𝒂 𝒇𝒆𝒆𝒍𝒊𝒏𝒈 𝒐𝒇 𝒍𝒂𝒖𝒈𝒉𝒕𝒆𝒓.',
                examples: ['laugh'],
                usage: 'laugh',
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
        const laughMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.laughMessages;
        const errorMessages = laughMessages.errors;

        try {
            // Get random laugh emoji
            const laughEmoji = emoji.emotes?.laugh || globalEmoji.emotes.laugh;
            const randomEmoji = client.utils.getRandomElement(laughEmoji);

            // Construct the embed
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', '𝐋𝐀𝐔𝐆𝐇')
                        .replace('%{mainRight}', emoji.mainRight) +
                    laughMessages.description.replace('%{user}', ctx.author.displayName)
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
            console.error('An error occurred in the Laugh command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Roar extends Command {
    constructor(client) {
        super(client, {
            name: 'roar',
            description: {
                content: 'Let out a mighty roar!',
                examples: ['roar'],
                usage: 'roar',
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
        const roarMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.roarMessages;
        const errorMessages = roarMessages.errors;

        try {
            // Get random roar emoji
            const roarEmoji = emoji.emotes?.roars || globalEmoji.emotes.roars;
            const randomEmote = client.utils.getRandomElement(roarEmoji);
            const emoteImageUrl = client.utils.emojiToImage(randomEmote);

            // Construct the embed with title moved to the description
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐑𝐀𝐎𝐑")
                        .replace('%{mainRight}', emoji.mainRight) +
                    roarMessages.description.replace('%{user}', ctx.author.displayName)
                )
                .setImage(emoteImageUrl)
                .setFooter({
                    text: generalMessages.requestedBy
                        .replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed message
            ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            // Error handling for any unexpected errors
            console.error('Error processing roar command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

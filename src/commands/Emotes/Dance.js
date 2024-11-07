const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Dance extends Command {
    constructor(client) {
        super(client, {
            name: 'dance',
            description: {
                content: 'Shows off some dance moves!',
                examples: ['dance'],
                usage: 'dance',
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
        const danceMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.danceMessages;
        const errorMessages = danceMessages.errors;

        try {
            // Get random dance emoji
            const danceEmoji = emoji.emotes?.dances || globalEmoji.emotes.dances;
            const randomEmoji = client.utils.getRandomElement(danceEmoji);

            // Constructing the embed
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', '𝐃𝐀𝐍𝐂𝐄')
                        .replace('%{mainRight}', emoji.mainRight) +
                    danceMessages.description.replace('%{user}', ctx.author.displayName))
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
            console.error('An error occurred in the Dance command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

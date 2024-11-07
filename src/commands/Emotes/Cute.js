const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Cute extends Command {
    constructor(client) {
        super(client, {
            name: 'cute',
            description: {
                content: 'Show off your cutest expression with an adorable animation!',
                examples: ['cute'],
                usage: 'cute',
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
        const cuteMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.cuteMessages;
        const errorMessages = cuteMessages.errors;

        try {
            // Get random cute emoji
            const cuteEmoji = emoji.emotes?.cute || globalEmoji.emotes.cute;
            const randomEmoji = client.utils.getRandomElement(cuteEmoji);

            // Constructing the embed
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', '𝐂𝐔𝐓𝐄')
                        .replace('%{mainRight}', emoji.mainRight) +
                    cuteMessages.description.replace('%{user}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setFooter({
                    text: generalMessages.requestedBy
                        .replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed message
            ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred in the Cute command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

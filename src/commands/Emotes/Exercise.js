const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Exercise extends Command {
    constructor(client) {
        super(client, {
            name: 'exercise',
            description: {
                content: 'Show off a feeling of exercising!',
                examples: ['exercise'],
                usage: 'exercise',
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
        const exerciseMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.exerciseMessages;
        const errorMessages = exerciseMessages.errors;

        try {
            // Get random exercise emoji
            const exerciseEmoji = emoji.emotes?.exercise || globalEmoji.emotes.exercise;
            const randomEmoji = client.utils.getRandomElement(exerciseEmoji);

            // Construct the embed
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', '𝐄𝐗𝐄𝐑𝐂𝐈𝐒𝐄')
                        .replace('%{mainRight}', emoji.mainRight) +
                    exerciseMessages.description.replace('%{user}', ctx.author.displayName)
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
            console.error('An error occurred in the Exercise command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

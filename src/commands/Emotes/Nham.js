const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Eat extends Command {
    constructor(client) {
        super(client, {
            name: 'nham',
            description: {
                content: 'Show off a feeling of eating!',
                examples: ['nham'],
                usage: 'nham',
            },
            category: 'emotes',
            aliases: ['c'],
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
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const eatMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.eatMessages;
        const errorMessages = eatMessages.errors;

        try {
            // Get random eat emoji
            const eatEmoji = emoji.emotes?.eat || globalEmoji.emotes.eat;
            const randomEmoji = client.utils.getRandomElement(eatEmoji);

            // Construct the embed with title moved to the description
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐄𝐀𝐓")  // Replace with eating title in the description
                        .replace('%{mainRight}', emoji.mainRight) +
                    eatMessages.description.replace('%{user}', ctx.author.displayName) // Replace user in description
                )
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setFooter({
                    text: generalMessages.requestedBy
                        .replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed message
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            // Error handling for any unexpected errors
            console.error('An error occurred in the Eat command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

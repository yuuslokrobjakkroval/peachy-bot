const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Shy extends Command {
    constructor(client) {
        super(client, {
            name: 'shy',
            description: {
                content: 'Show off a shy expression with a cute animation!',
                examples: ['shy'],
                usage: 'shy',
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
        const shyMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.shyMessages;
        const errorMessages = shyMessages.errors;

        try {
            // Get random shy emoji
            const shyEmoji = emoji.emotes?.shy || globalEmoji.emotes.shy;
            const randomEmote = client.utils.getRandomElement(shyEmoji);
            const emoteImageUrl = client.utils.emojiToImage(randomEmote);

            // Construct the embed with title moved to the description
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐒𝐇𝐘")  // Use "SHY" as the title in description
                        .replace('%{mainRight}', emoji.mainRight) +
                    shyMessages.description.replace('%{user}', ctx.author.displayName) // Replace user in description
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
            console.error('Error processing shy command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color); // Use localized error message
        }
    }
};

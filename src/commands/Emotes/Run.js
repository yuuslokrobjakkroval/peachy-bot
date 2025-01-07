const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Run extends Command {
    constructor(client) {
        super(client, {
            name: 'run',
            description: {
                content: '𝑳𝒆𝒕 𝒐𝒖𝒕 𝒂 𝒎𝒊𝒈𝒉𝒕𝒚 𝒓𝒖𝒏!',
                examples: ['run'],
                usage: 'run',
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
        const runMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.runMessages;
        const errorMessages = runMessages.errors;

        try {
            // Get random run emoji
            const runEmoji = emoji.emotes?.run || globalEmoji.emotes.run;
            const randomEmote = client.utils.getRandomElement(runEmoji);
            const emoteImageUrl = client.utils.emojiToImage(randomEmote);

            // Construct the embed with title moved to the description
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐑𝐔𝐍")  // Use "RUN" as the title in description
                        .replace('%{mainRight}', emoji.mainRight) +
                    runMessages.description.replace('%{user}', ctx.author.displayName) // Replace user in description
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
            console.error('Error processing run command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color); // Use localized error message
        }
    }
};

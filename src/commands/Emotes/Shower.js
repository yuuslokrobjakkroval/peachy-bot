const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Shower extends Command {
    constructor(client) {
        super(client, {
            name: 'shower',
            description: {
                content: '𝑺𝒉𝒐𝒘 𝒐𝒇𝒇 𝒂 𝒇𝒆𝒆𝒍𝒊𝒏𝒈 𝒐𝒇 𝒕𝒂𝒌𝒊𝒏𝒈 𝒂 𝒔𝒉𝒐𝒘𝒆𝒓!',
                examples: ['shower'],
                usage: 'shower',
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
        const showerMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.showerMessages;
        const errorMessages = showerMessages.errors;

        try {
            // Get random shower emoji
            const showerEmoji = emoji.emotes?.shower || globalEmoji.emotes.shower;
            const randomEmote = client.utils.getRandomElement(showerEmoji);
            const emoteImageUrl = client.utils.emojiToImage(randomEmote);

            // Construct the embed with title moved to the description
            const embed = client.embed()
                .setColor(color.main)
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐒𝐇𝐎𝐖𝐄𝐑")  // Use "SHOWER" as the title in description
                        .replace('%{mainRight}', emoji.mainRight) +
                    showerMessages.description.replace('%{user}', ctx.author.displayName) // Replace user in description
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
            console.error('Error processing shower command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color); // Use localized error message
        }
    }
};

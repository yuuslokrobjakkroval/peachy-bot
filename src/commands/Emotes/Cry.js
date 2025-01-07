const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Cry extends Command {
    constructor(client) {
        super(client, {
            name: 'cry',
            description: {
                content: '𝑬𝒙𝒑𝒓𝒆𝒔𝒔 𝒂 𝒇𝒆𝒆𝒍𝒊𝒏𝒈 𝒐𝒇 𝒄𝒓𝒚𝒊𝒏𝒈.',
                examples: ['cry'],
                usage: 'cry',
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
        const cryMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.cryMessages;
        const errorMessages = cryMessages.errors;

        try {
            // Ensure we are getting a valid random emoji from the list
            const cryEmoji = emoji.emotes?.cry || globalEmoji.emotes.cry;
            const randomEmoji = client.utils.getRandomElement(cryEmoji);

            // Constructing the embed with title, description, and image
            const embed = client.embed()
                .setColor(color.main).setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', '𝐂𝐑𝐘')
                        .replace('%{mainRight}', emoji.mainRight) +
                    cryMessages.description.replace('%{user}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setFooter({
                    text: generalMessages.requestedBy
                        .replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed to the channel
            ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred in the Cry command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

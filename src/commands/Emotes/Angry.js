const { Command } = require('../../structures/index.js');
const globalEmoji = require('../../utils/Emoji');

module.exports = class Angry extends Command {
    constructor(client) {
        super(client, {
            name: 'angry',
            description: {
                content: 'Show off your angriest expression with a fierce animation!',
                examples: ['angry'],
                usage: 'angry',
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
        const angryMessages = language.locales.get(language.defaultLocale)?.emoteMessages?.angryMessages;
        const errorMessages = angryMessages.errors;

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.emotes && emoji.emotes.angry ? emoji.emotes.angry : globalEmoji.emotes.angry);

            const embed = client.embed()
                .setColor(color.main)
                .setDescription(generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐀𝐍𝐆𝐑𝐘")
                        .replace('%{mainRight}', emoji.mainRight) +
                    angryMessages.description.replace('%{user}', ctx.author.displayName))
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', `*${ctx.author.displayName}*`) || `Requested by *${ctx.author.displayName}*`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('An error occurred in the Angry command:', error);
            client.utils.sendErrorMessage(client, ctx, errorMessages, color);
        }
    }
};

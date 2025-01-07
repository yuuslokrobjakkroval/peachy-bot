const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Loung extends Command {
    constructor(client) {
        super(client, {
            name: 'loung',
            description: {
                content: '𝑺𝒆𝒏𝒅𝒔 𝒂 𝒄𝒖𝒕𝒆 𝒆𝒎𝒐𝒋𝒊 𝒍𝒐𝒖𝒏𝒈 𝒕𝒐 𝒕𝒉𝒆 𝒎𝒆𝒏𝒕𝒊𝒐𝒏𝒆𝒅 𝒖𝒔𝒆𝒓.',
                examples: ['𝒍𝒐𝒖𝒏𝒈 @𝑼𝒔𝒆𝒓'],
                usage: '𝒍𝒐𝒖𝒏𝒈 @𝑼𝒔𝒆𝒓',
            },
            category: 'actions',
            aliases: [],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'Mention the user you want to loung.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const loungMessages = language.locales.get(language.defaultLocale)?.actionMessages?.loungMessages;
        const errorMessages = loungMessages.errors;

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Error handling if no user is mentioned or the user loungs themselves
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser;
            if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfLoung;

            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.loung ? emoji.actions.loung : globalEmoji.actions.loung);

        const embed = client.embed()
            .setColor(color.main)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐊𝐈𝐒𝐒")
                    .replace('%{mainRight}', emoji.mainRight) +
                loungMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        ctx.sendMessage({ embeds: [embed] })
            .catch(error => {
                console.error('Failed to fetch loung GIF:', error);
                client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the loung GIF."
            });
    }
};

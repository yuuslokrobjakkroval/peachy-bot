const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Kiss extends Command {
    constructor(client) {
        super(client, {
            name: 'kiss',
            description: {
                content: '𝑺𝒆𝒏𝒅𝒔 𝒂 𝒄𝒖𝒕𝒆 𝒌𝒊𝒔𝒔 𝒕𝒐 𝒕𝒉𝒆 𝒎𝒆𝒏𝒕𝒊𝒐𝒏𝒆𝒅 𝒖𝒔𝒆𝒓.',
                examples: ['kiss @user'],
                usage: 'kiss <user>',
            },
            category: 'actions',
            aliases: [],
            cooldown: 5,
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
                    description: 'The user you want to kiss.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const kissMessages = language.locales.get(language.defaultLocale)?.actionMessages?.kissMessages;
        const errorMessages = kissMessages.errors;

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser;
            if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfKiss;

            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.kisses ? emoji.actions.kisses : globalEmoji.actions.kisses);

        const embed = client.embed()
            .setColor(color.main)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐊𝐈𝐒𝐒")
                    .replace('%{mainRight}', emoji.mainRight) +
                kissMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        ctx.sendMessage({ embeds: [embed] })
            .catch(error => {
                console.error('Failed to fetch kiss GIF:', error);
                client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the kiss GIF."
            });
    }
};

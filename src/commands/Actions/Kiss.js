const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Kiss extends Command {
    constructor(client) {
        super(client, {
            name: 'kiss',
            description: {
                content: 'Sends a cute kiss to the mentioned user.',
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

    async run(client, ctx, args, color, emoji, language) {
        try {
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

                return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
            }

            const randomEmoji = client.utils.getRandomElement(
                emoji.actions?.kisses || globalEmoji.actions.kisses
            );

            const embed = client.embed()
                .setColor(color.main)
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "KISS")
                        .replace('%{mainRight}', emoji.mainRight) +
                    kissMessages.description
                        .replace('%{displayName}', ctx.author.displayName)
                        .replace('%{target}', target.displayName)
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send kiss message:', error);
            await client.utils.sendErrorMessage(client, ctx, "An error occurred while executing the command.", color);
        }
    }
};
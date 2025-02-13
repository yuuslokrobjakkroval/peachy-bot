const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Kill extends Command {
    constructor(client) {
        super(client, {
            name: 'kill',
            description: {
                content: '𝑺𝒆𝒏𝒅𝒔 𝒂 𝒄𝒖𝒕𝒆 𝒌𝒊𝒍𝒍 𝒕𝒐 𝒕𝒉𝒆 𝒎𝒆𝒏𝒕𝒊𝒐𝒏𝒆𝒅 𝒖𝒔𝒆𝒓.',
                examples: ['𝒌𝒊𝒍𝒍 @𝑼𝒔𝒆𝒓'],
                usage: '𝒌𝒊𝒍𝒍 @𝑼𝒔𝒆𝒓',
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
                    description: 'Mention the user you want to kill.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
            const killMessages = language.locales.get(language.defaultLocale)?.actionMessages?.killMessages;
            const errorMessages = killMessages.errors;

            const target = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

            // Error handling if no user is mentioned or the user tries to kill themselves
            if (!target || target.id === ctx.author.id) {
                let errorMessage = '';
                if (!target) errorMessage += errorMessages.noUser;
                if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfKill;

                return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
            }

            const randomEmoji = client.utils.getRandomElement(
                emoji.actions?.kill || globalEmoji.actions.kill
            );

            const embed = client.embed()
                .setColor(color.main)
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐊𝐈𝐋𝐋")
                        .replace('%{mainRight}', emoji.mainRight) +
                    killMessages.description
                        .replace('%{displayName}', ctx.author.displayName)
                        .replace('%{target}', target.displayName)
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send kill message:', error);
            await client.utils.sendErrorMessage(client, ctx, "An error occurred while executing the command.", color);
        }
    }
};

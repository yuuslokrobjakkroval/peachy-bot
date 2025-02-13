const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Punch extends Command {
    constructor(client) {
        super(client, {
            name: 'punch',
            description: {
                content: '𝑻𝒉𝒓𝒐𝒘𝒔 𝒂 𝒑𝒍𝒂𝒚𝒇𝒖𝒍 𝒑𝒖𝒏𝒄𝒉 𝒂𝒕 𝒕𝒉𝒆 𝒎𝒆𝒏𝒕𝒊𝒐𝒏𝒆𝒅 𝒖𝒔𝒆𝒓.',
                examples: ['punch @User'],
                usage: 'punch @User',
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
                    description: 'Mention the user you want to punch.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
            const punchMessages = language.locales.get(language.defaultLocale)?.actionMessages?.punchMessages;
            const errorMessages = punchMessages?.errors || {};

            // Fetch the target user
            const target = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

            // Error handling: No target or self-punch
            if (!target || target.id === ctx.author.id) {
                let errorMessage = '';
                if (!target) errorMessage += errorMessages.noUser || "You need to mention a user to punch.";
                if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfPunch || "You cannot punch yourself.";

                return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
            }

            const randomEmoji = client.utils.getRandomElement(
                emoji.actions?.punches || globalEmoji.actions.punches
            );

            // Create the embed message
            const embed = client.embed()
                .setColor(color.main)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is valid
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐏𝐔𝐍𝐂𝐇")
                        .replace('%{mainRight}', emoji.mainRight) +
                    punchMessages.description
                        .replace('%{displayName}', ctx.author.displayName)
                        .replace('%{target}', target.username) // Fixed username reference
                )
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            // Send the embed message
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send punch message:', error);
            await client.utils.sendErrorMessage(client, ctx, "An error occurred while executing the command.", color);
        }
    }
};

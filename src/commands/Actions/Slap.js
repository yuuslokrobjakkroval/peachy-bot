const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Slap extends Command {
    constructor(client) {
        super(client, {
            name: 'slap',
            description: {
                content: '𝑺𝒆𝒏𝒅𝒔 𝒂 𝒑𝒍𝒂𝒚𝒇𝒖𝒍 𝒔𝒍𝒂𝒑 𝒕𝒐 𝒕𝒉𝒆 𝒎𝒆𝒏𝒕𝒊𝒐𝒏𝒆𝒅 𝒖𝒔𝒆𝒓.',
                examples: ['slap @User'],
                usage: 'slap @User',
            },
            category: 'actions',
            aliases: ['smack'],
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
                    description: 'Mention the user you want to slap.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
            const slapMessages = language.locales.get(language.defaultLocale)?.actionMessages?.slapMessages;
            const errorMessages = slapMessages?.errors || {};

            // Fetch the target user
            const target = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

            // Error handling: No target or self-slap
            if (!target || target.id === ctx.author.id) {
                let errorMessage = '';
                if (!target) errorMessage += errorMessages.noUser || "You need to mention a user to slap.";
                if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfSlap || "You cannot slap yourself.";

                return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
            }

            const randomEmoji = client.utils.getRandomElement(
                emoji.actions?.slaps || globalEmoji.actions.slaps
            );

            // Create the embed message
            const embed = client.embed()
                .setColor(color.main)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is valid
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', "𝐒𝐋𝐀𝐏")
                        .replace('%{mainRight}', emoji.mainRight) +
                    slapMessages.description
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
            console.error('Failed to send slap message:', error);
            await client.utils.sendErrorMessage(client, ctx, "An error occurred while executing the command.", color);
        }
    }
};

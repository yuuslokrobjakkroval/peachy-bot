const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Punch extends Command {
    constructor(client) {
        super(client, {
            name: 'punch',
            description: {
                content: 'Throws a playful punch at the mentioned user.',
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

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const punchMessages = language.locales.get(language.defaultLocale)?.actionMessages?.punchMessages;
        const errorMessages = punchMessages.errors;

        // Fetch the target user
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Error handling if no user is mentioned or the user punches themselves
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser; // "You need to mention a user to punch."
            if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfPunch; // "You cannot punch yourself."

            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.punches ? emoji.actions.punches : globalEmoji.actions.punches);

        // Create the embed message for punching
        const embed = client.embed()
            .setColor(color.main)
            .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐏𝐔𝐍𝐂𝐇")
                    .replace('%{mainRight}', emoji.mainRight) +
                punchMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', `*${ctx.author.displayName}*`) || `Requested by *${ctx.author.displayName}*`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        // Send the embed message and handle errors
        ctx.sendMessage({ embeds: [embed] })
            .catch(error => {
                console.error('Failed to fetch punch GIF:', error);
                client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the punch GIF."
            });
    }
};

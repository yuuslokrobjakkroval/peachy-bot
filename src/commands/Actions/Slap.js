const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Slap extends Command {
    constructor(client) {
        super(client, {
            name: 'slap',
            description: {
                content: 'Sends a playful slap to the mentioned user.',
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

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const slapMessages = language.locales.get(language.defaultLocale)?.actionMessages?.slapMessages;
        const errorMessages = slapMessages.errors;

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Error handling if no user is mentioned or the user slaps themselves
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser; // "You need to mention a user to slap."
            if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfSlap; // "You cannot slap yourself."

            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.slaps ? emoji.actions.slaps : globalEmoji.actions.slaps);

        // Create the embed message for slapping
        const embed = client.embed()
            .setColor(color.main)
            .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐒𝐋𝐀𝐏")
                    .replace('%{mainRight}', emoji.mainRight) +
                slapMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', `*${ctx.author.displayName}*`) || `Requested by *${ctx.author.displayName}*`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        // Send the embed message and handle any errors
        ctx.sendMessage({ embeds: [embed] })
            .catch(error => {
                console.error('Failed to fetch slap GIF:', error);
                client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the slap GIF."
            });
    }
};

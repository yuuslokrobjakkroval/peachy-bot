const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Bite extends Command {
    constructor(client) {
        super(client, {
            name: 'bite',
            description: {
                content: 'Playfully bites the mentioned user.',
                examples: ['bite @User'],
                usage: 'bite @User',
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
                    description: 'Mention the user you want to bite.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const biteMessages = language.locales.get(language.defaultLocale)?.actionMessages?.biteMessages;
        const errorMessages = biteMessages.errors;

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Error handling if no user is mentioned or the user bites themselves
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser;
            if (target && target.id === ctx.author.id) errorMessage += errorMessages.selfBite;

            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.bites ? emoji.actions.bites : globalEmoji.actions.bites);

        // Create the embed message for biting
        const embed = client.embed()
            .setColor(color.main)
            .setImage(client.utils.emojiToImage(randomEmoji))
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "𝐁𝐈𝐓𝐄")
                    .replace('%{mainRight}', emoji.mainRight) +
                biteMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        ctx.sendMessage({ embeds: [embed] })
            .catch(error => {
                console.error('Failed to fetch bite GIF:', error);
                client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color);
            });
    }
};

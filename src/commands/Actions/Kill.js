const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Bite extends Command {
    constructor(client) {
        super(client, {
            name: 'kill',
            description: {
                content: 'Sends a cute kill to the mentioned user.',
                examples: ['kill @User'],
                usage: 'kill @User',
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

    async run(client, ctx, args, color, emoji, language) {
        const killMessages = language.locales.get(language.defaultLocale)?.actionMessages?.killMessages;
        const errorMessages = biteMessages.errors;

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Error handling if no user is mentioned or the user bites themselves
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser;
            if (target && target.id === ctx.author.id) errorMessage += `\n${errorMessages.selfBite}`;

            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.kill ? emoji.actions.kill : globalEmoji.actions.kill);

            // Create the embed message for biting
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${killMessages.title} ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
                .setDescription(killMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch bite GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color);
        }
    }
};

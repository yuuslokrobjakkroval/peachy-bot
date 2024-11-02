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

    async run(client, ctx, args, color, emoji, language) {
        // Fetch translated messages from the language object
        const punchMessages = language.locales.get(language.defaultLocale)?.actionMessages?.punchMessages;
        const errorMessages = punchMessages.errors;

        // Fetch the target user
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Handle errors for missing user or self-punch
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser; // "You need to mention a user to punch."
            if (target && target.id === ctx.author.id) errorMessage += `\n${errorMessages.selfPunch}`; // "You cannot punch yourself."

            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions ? emoji.actions.punches : globalEmoji.actions.punches);

            // Create the embed for the punch action
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${punchMessages.title} ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
                .setDescription(`${ctx.author.displayName} ${punchMessages.description} ${target.displayName}!`);

            // Send the embed message
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch punch GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the punch GIF."
        }
    }
};

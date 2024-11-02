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

    async run(client, ctx, args, color, emoji, language) {
        // Fetch translated messages from the language object
        const slapMessages = language.locales.get(language.defaultLocale)?.actionMessages?.slapMessages;
        const errorMessages = slapMessages.errors;

        // Fetch the target user
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Handle errors for missing user or self-slap
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser; // "You need to mention a user to slap."
            if (target && target.id === ctx.author.id) errorMessage += `\n${errorMessages.selfSlap}`; // "You cannot slap yourself."

            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.slaps ? emoji.actions.slaps : globalEmoji.actions.slaps);

            // Create the embed for the slap action
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${slapMessages.title} ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
                .setDescription(`${ctx.author.displayName} ${slapMessages.description} ${target.displayName}!`);

            // Send the embed message
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch slap GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the slap GIF."
        }
    }
};

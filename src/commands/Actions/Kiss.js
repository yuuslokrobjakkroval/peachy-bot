const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Kiss extends Command {
    constructor(client) {
        super(client, {
            name: 'kiss',
            description: {
                content: 'Sends a cute kiss anime action.',
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
        // Fetch translated messages from the language object
        const kissMessages = language.locales.get(language.defaultLocale)?.actionMessages?.kissMessages;
        const errorMessages = kissMessages.errors;

        // Fetch the target user
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        // Handle errors for missing user or self-kissing
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser; // "You need to mention a user to kiss."
            if (target && target.id === ctx.author.id) errorMessage += `\n${errorMessages.selfKiss}`; // "You cannot kiss yourself."

            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.kisses ? emoji.actions.kisses : globalEmoji.actions.kisses);

            // Create the embed for the kiss action
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${kissMessages.title} ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
                .setDescription(`${ctx.author.displayName} ${kissMessages.description} ${target.displayName}!`);

            // Send the embed message
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch kiss GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color); // "Something went wrong while fetching the kiss GIF."
        }
    }
};

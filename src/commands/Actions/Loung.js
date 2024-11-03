const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Bite extends Command {
    constructor(client) {
        super(client, {
            name: 'loung',
            description: {
                content: 'Sends a cute emoji loung to the mentioned user.',
                examples: ['loung @User'],
                usage: 'loung @User',
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
                    description: 'Mention the user you want to loung.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const loungMessages = language.locales.get(language.defaultLocale)?.actionMessages?.loungMessages;
        const errorMessages = loungMessages.errors;

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
            const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.loung ? emoji.actions.loung : globalEmoji.actions.loung);

            // Create the embed message for biting
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${loungMessages.title} ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji)) // Ensure the image is a valid URL or attachment
                .setDescription(loungMessages.description
                    .replace('%{displayName}', ctx.author.displayName)
                    .replace('%{target}', target.displayName));

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch bite GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color);
        }
    }
};

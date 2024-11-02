const { Command } = require('../../structures/index.js');
const globalEmoji = require("../../utils/Emoji");

module.exports = class Hug extends Command {
    constructor(client) {
        super(client, {
            name: 'hug',
            description: {
                content: 'Sends a cute hug to the mentioned user.',
                examples: ['hug @user'],
                usage: 'hug @user',
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
                    description: 'Mention the user you want to hug.',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {

        const hugMessages = language.locales.get(language.defaultLocale)?.actionMessages?.hugMessages;
        const errorMessages = hugMessages.errors;

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);
        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += errorMessages.noUser;
            if (target && target.id === ctx.author.id) errorMessage += `\n${errorMessages.selfHug}`;

            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions && emoji.actions.hugs ? emoji.actions.hugs : globalEmoji.actions.hugs);

            // Create the embed message for hugging
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${hugMessages.title} ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setDescription(`${ctx.author.displayName} ${hugMessages.description} ${target.displayName}!`);

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch hug GIF:', error);
            return await client.utils.sendErrorMessage(client, ctx, errorMessages.fetchFail, color);
        }
    }
};

const { Command } = require('../../structures/index.js');

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
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += 'You need to mention a user to hug.';
            if (target.id === ctx.author.id) errorMessage += 'You cannot hug yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions.hugs);
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} Hug Time! ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setDescription(`${ctx.author.displayName} gives ${target.displayName} a warm hug!`);
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch hug GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the hug GIF.' });
        }
    }
};

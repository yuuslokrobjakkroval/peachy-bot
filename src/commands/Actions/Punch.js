const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

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
                    description: 'Mention the user you want to punch',
                    type: 6, // USER type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args) {
        const author = ctx.author;
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        if (!target || target.id === author.id) {
            let errorMessage = '';
            if (!target) errorMessage += 'You need to mention a user to punch.';
            if (target.id === author.id) errorMessage += 'You cannot punch yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const punchGif = await Anime.punch();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.displayName} playfully punches ${target.displayName}! 👊😜`)
                        .setImage(punchGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch punch GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the punch GIF.' });
        }
    }
};

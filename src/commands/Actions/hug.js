const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Hug extends Command {
    constructor(client) {
        super(client, {
            name: 'hug',
            description: {
                content: 'Sends a cute hug anime action.',
                examples: ['hug @user'],
                usage: 'hug <user>',
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
                    description: 'The user you want to hug.',
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
            if (!target) errorMessage += 'You need to mention a user to hug.';
            if (target.id === author.id) errorMessage += 'You cannot hug yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const hugGif = await Anime.hug(); // Fetches a cute hug GIF from the anime-actions package

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.username} gives ${target.username} a warm hug!`)
                        .setImage(hugGif), // Uses the GIF URL from the package
                ],
            });
        } catch (error) {
            console.error('Failed to fetch hug GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the hug GIF.' });
        }
    }
};

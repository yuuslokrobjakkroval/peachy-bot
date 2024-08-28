const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Kiss extends Command {
    constructor(client) {
        super(client, {
            name: 'kiss',
            description: {
                content: 'Sends a cute kiss anime action.',
                examples: ['kiss @user'],
                usage: 'kiss <user>',
            },
            category: 'anime-actions',
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

    async run(client, ctx, args) {
        const author = ctx.author;
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        if (!target || target.id === author.id) {
            let errorMessage = '';
            if (!target) errorMessage += 'You need to mention a user to kiss.';
            if (target.id === author.id) errorMessage += 'You cannot kiss yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const kissGif = await Anime.kiss(); // Fetches a cute kiss GIF from the anime-actions package

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.username} kisses ${target.username}!`)
                        .setImage(kissGif), // Uses the GIF URL from the package
                ],
            });
        } catch (error) {
            console.error('Failed to fetch kiss GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the kiss GIF.' });
        }
    }
};

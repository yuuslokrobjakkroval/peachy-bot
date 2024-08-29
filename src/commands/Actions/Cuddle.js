const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Cuddle extends Command {
    constructor(client) {
        super(client, {
            name: 'cuddle',
            description: {
                content: 'Sends a cozy cuddle to the mentioned user.',
                examples: ['cuddle @User'],
                usage: 'cuddle @User',
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
                    description: 'Mention the user you want to cuddle',
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
            if (!target) errorMessage += 'You need to mention a user to cuddle.';
            if (target.id === author.id) errorMessage += 'You cannot cuddle yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const cuddleGif = await Anime.cuddle();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.displayName} cozily cuddles ${target.displayName}! 🤗💖`)
                        .setImage(cuddleGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch cuddle GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the cuddle GIF.' });
        }
    }
};

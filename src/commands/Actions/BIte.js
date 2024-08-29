const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class Bite extends Command {
    constructor(client) {
        super(client, {
            name: 'bite',
            description: {
                content: 'Playfully bites the mentioned user.',
                examples: ['bite @User'],
                usage: 'bite @User',
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
                    description: 'Mention the user you want to bite',
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
            if (!target) errorMessage += 'You need to mention a user to bite.';
            if (target.id === author.id) errorMessage += 'You cannot bite yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const biteGif = await Anime.bite();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.displayName} playfully bites ${target.displayName}! 😜🦷`)
                        .setImage(biteGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch bite GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the bite GIF.' });
        }
    }
};

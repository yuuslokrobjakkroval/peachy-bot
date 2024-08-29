const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

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
                    description: 'Mention the user you want to slap',
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
            if (!target) errorMessage += 'You need to mention a user to slap.';
            if (target.id === author.id) errorMessage += 'You cannot slap yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const slapGif = await Anime.slap();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.displayName} playfully slaps ${target.displayName}! 👋`)
                        .setImage(slapGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch slap GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the slap GIF.' });
        }
    }
};

const { Command } = require('../../structures/index.js');
const Anime = require('anime-actions');

module.exports = class HighFive extends Command {
    constructor(client) {
        super(client, {
            name: 'highfive',
            description: {
                content: 'Gives a high-five to the mentioned user.',
                examples: ['highfive @User'],
                usage: 'highfive @User',
            },
            category: 'actions',
            aliases: ['high-five'],
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
                    description: 'Mention the user you want to high-five',
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
            if (!target) errorMessage += 'You need to mention a user to high-five.';
            if (target.id === author.id) errorMessage += 'You cannot high-five yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const highFiveGif = await Anime.highfive();

            return await ctx.sendMessage({
                embeds: [
                    client
                        .embed()
                        .setColor(client.color.main)
                        .setTitle(`${author.displayName} gives a high-five to ${target.displayName}! ✋😄`)
                        .setImage(highFiveGif),
                ],
            });
        } catch (error) {
            console.error('Failed to fetch high-five GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the high-five GIF.' });
        }
    }
};

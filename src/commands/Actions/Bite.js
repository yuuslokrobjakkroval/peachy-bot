const { Command } = require('../../structures/index.js');

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

    async run(client, ctx, args, color, emoji, language) {
        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user')
            : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

        if (!target || target.id === ctx.author.id) {
            let errorMessage = '';
            if (!target) errorMessage += 'You need to mention a user to bite.';
            if (target.id === ctx.author.id) errorMessage += 'You cannot bite yourself.';

            return await ctx.sendMessage({ content: errorMessage });
        }

        try {
            const randomEmoji = client.utils.getRandomElement(emoji.actions.bites);
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} Bite Time! ${emoji.mainRight}`)
                .setImage(client.utils.emojiToImage(randomEmoji))
                .setDescription(`${ctx.author.displayName} playfully bites ${target.displayName}!`);
            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to fetch bite GIF:', error);
            return await ctx.sendMessage({ content: 'Something went wrong while fetching the bite GIF.' });
        }
    }
};

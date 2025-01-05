const Command = require('../../structures/Command.js');
const canvafy = require('canvafy');

module.exports = class Ship extends Command {
    constructor(client) {
        super(client, {
            name: 'guess',
            description: {
                content: 'Guess the relationship between two users.',
                examples: ['guess @user1 @user2'],
                usage: 'guess <user1> <user2>',
            },
            category: 'fun',
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
                    name: 'target',
                    description: 'The first user to guess relationship',
                    type: 6,
                    required: true,
                },
                {
                    name: 'partner',
                    description: 'The second user to guess relationship',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            if (ctx.isInteraction) {
                await ctx.interaction.reply('Thinking...');
            } else {
                await ctx.sendDeferMessage('Thinking...');
            }

            const target = ctx.isInteraction
                ? ctx.interaction.options.getUser('target')
                : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[0]);

            const partner = ctx.isInteraction
                ? ctx.interaction.options.getUser('partner')
                : ctx.message.mentions.users.at(1) || ctx.guild.members.cache.get(args[1]);

            if (!target || !partner) {
                ctx.isInteraction
                    ? await ctx.interaction.editReply({ content: '', embeds: [], files: [] })
                    : await ctx.editMessage({ content: '', embeds: [], files: [] });
                return client.utils.sendErrorMessage(client, ctx, 'Please mention two valid users.', color);
            }

            if (target.id === partner.id) {
                ctx.isInteraction
                    ? await ctx.interaction.editReply({ content: '', embeds: [], files: [] })
                    : await ctx.editMessage({ content: '', embeds: [], files: [] });
                return client.utils.sendErrorMessage(client, ctx, 'You cannot guess a relationship with the same user.', color);
            }

            const ship = await new canvafy.Ship()
                .setAvatars(
                    target.displayAvatarURL({ forceStatic: true, extension: 'png' }),
                    partner.displayAvatarURL({ forceStatic: true, extension: 'png' })
                )
                .setBackground('image', 'https://i.imgur.com/WRQ9JgJ.jpg')
                .setBorder('#FFCFCF')
                .setOverlayOpacity(0.7)
                .build();

            ctx.isInteraction
                ? await ctx.interaction.editReply({
                    content: '',
                    embeds: [],
                    files: [{ attachment: ship, name: `ship-${target.username}-${partner.username}.png` }],
                })
                : await ctx.editMessage({
                    content: '',
                    embeds: [],
                    files: [{ attachment: ship, name: `ship-${target.username}-${partner.username}.png` }],
                });
        } catch (error) {
            await client.utils.sendErrorMessage(
                client,
                ctx,
                'An error occurred while generating the ship image. Please try again later.',
                color
            );
            console.error(error);
        }
    }
};

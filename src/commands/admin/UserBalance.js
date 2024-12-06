const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const globalGif = require('../../utils/Gif');

module.exports = class UserBalance extends Command {
    constructor(client) {
        super(client, {
            name: 'userbalance',
            description: {
                content: 'Displays a user\'s balance and daily transfer/receive limits.',
                examples: ['ubal @user'],
                usage: 'ubal <@user>',
            },
            category: 'developer',
            aliases: ['ubal'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'user',
                    description: 'The user you want to check.',
                    type: 6,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const mention = ctx.isInteraction
                ? ctx.interaction.options.getUser('user')
                : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || args[0];

            const userId = typeof mention === 'string' ? mention : mention.id;
            const syncUser = await client.users.fetch(userId);
            const user = await Users.findOne({ userId: syncUser.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.', color);
            }

            const { coin = 0, bank = 0 } = user.balance;

            const embed = client.embed()
                .setTitle(`${target.displayName}'s Balance`)
                .setColor(color.main)
                .setThumbnail(globalGif.balanceThumbnail ? globalGif.balanceThumbnail : client.utils.emojiToImage(emoji.main))
                .setDescription(
                    `**Coin: \`${client.utils.formatNumber(coin)}\`** ${emoji.coin}\n` +
                    `**Bank: \`${client.utils.formatNumber(bank)}\`** ${emoji.coin}`
                );

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in user balance command:', error);
            return await ctx.sendMessage({
                content: 'An error occurred while processing your request.',
            });
        }
    }
};

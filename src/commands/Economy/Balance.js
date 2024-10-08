const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");
const gif = require('../../utils/Gif.js');

module.exports = class Balance extends Command {
    constructor(client) {
        super(client, {
            name: 'balance',
            description: {
                content: 'Displays your balance and daily transfer/receive limits.',
                examples: ['balance'],
                usage: 'balance',
            },
            category: 'economy',
            aliases: ['bal', 'money', 'cash'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.', color);
            }
            const { coin = 0, bank = 0 } = user.balance;

            const embed = client
                .embed()
                .setTitle(`${emoji.mainLeft} ${ctx.author.displayName}'s Balance ${emoji.mainRight}`)
                .setColor(color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    `**${emoji.coin} : \`${client.utils.formatNumber(coin)}\` coins\n${emoji.bank} : \`${client.utils.formatNumber(bank)}\` coins**\n`
                )
                .setImage(gif.balanceBanner)

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Balance command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching the balance.', color);
        }
    }
};

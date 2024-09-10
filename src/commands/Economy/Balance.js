const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

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

    async run(client, ctx, args, language) {
        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user) {
                return await client.utils.sendErrorMessage(client, ctx, 'User not found.');
            }
            const { coin = 0, bank = 0 } = user.balance;

            const embed = client
                .embed()
                .setTitle(`${this.client.emoji.mainLeft} ${ctx.author.displayName}'s Balance ${this.client.emoji.mainRight}`)
                .setColor(client.color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    `**Coin: \`${client.utils.formatNumber(coin)}\` ${client.emoji.coin}\nBank: \`${client.utils.formatNumber(bank)}\` ${client.emoji.coin}**`
                )

            return await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Balance command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching the balance.');
        }
    }
};

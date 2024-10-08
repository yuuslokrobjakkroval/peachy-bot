const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Deposit extends Command {
    constructor(client) {
        super(client, {
            name: 'deposit',
            description: {
                content: 'Deposit currency coins to your bank.',
                examples: ['deposit 100'],
                usage: 'deposit <amount>',
            },
            category: 'economy',
            aliases: ['dep'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [{ name: 'amount', description: 'The amount you want to deposit.', type: 3, required: true }],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const user = await Users.findOne({ userId: ctx.author.id }).exec();

        const { coin, bank } = user.balance;

        if (coin < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'), color);

        let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || coin : args[0] || coin;
        if (isNaN(amount) || amount < 1 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: coin, half: Math.ceil(coin / 2) };

            if (amount in amountMap) amount = amountMap[amount];
            else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.red).setDescription(client.i18n.get(language, 'commands', 'invalid_amount'), color),
                    ],
                });
            }
        }

        const baseCoins = parseInt(Math.min(amount, coin));

        const newCoin = coin - baseCoins;
        const newBank = bank + baseCoins;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(`You have deposited ${emoji.coin} **\`${client.utils.formatNumber(baseCoins)}\`** coins to your bank.`);

        await Promise.all([
            Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newCoin, 'balance.bank': newBank } }).exec(),
        ]);

        return await ctx.sendMessage({ embeds: [embed] });
    }
};


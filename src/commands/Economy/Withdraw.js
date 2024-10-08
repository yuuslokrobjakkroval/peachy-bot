const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user.js");

module.exports = class Withdraw extends Command {
    constructor(client) {
        super(client, {
            name: 'withdraw',
            description: {
                content: 'Withdraw currency coins from your bank.',
                examples: ['withdraw 100'],
                usage: 'withdraw <amount>',
            },
            category: 'economy',
            aliases: ['with', 'dokluy', 'berkluy'],
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
                    name: 'amount',
                    description: 'The amount you want to withdraw.',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const user = await Users.findOne({ userId: ctx.author.id });
        const { coin, bank } = user.balance;

        if (bank < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'), color);

        let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || bank : args[0] || bank;
        if (isNaN(amount) || amount < 1 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: bank, half: Math.ceil(bank / 2) };

            if (amount in amountMap) amount = amountMap[amount];
            else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.red).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
                    ],
                });
            }
        }

        const baseCoins = parseInt(Math.min(amount, bank));

        const newCoin = coin + baseCoins;
        const newBank = bank - baseCoins;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(`You have withdraw ${emoji.coin} **\`${client.utils.formatNumber(baseCoins)}\`** coins to your bank.`);

        await Promise.all([
            Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newCoin, 'balance.bank': newBank } }).exec(),
        ]);

        return await ctx.sendMessage({ embeds: [embed] });
    }
};


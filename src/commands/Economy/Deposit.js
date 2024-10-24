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
            options: [{ name: 'amount', description: 'The amount you want to deposit.', type: 4, required: true }], // Changed type to INTEGER
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const depositMessages = language.locales.get(language.defaultLocale)?.economyMessages?.depositMessages;
        try {
            client.utils.getUser(ctx.author.id).then(user => {
                if (!user) {
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
                }

                const { coin, bank } = user.balance;
                if (coin < 1) {
                    return client.utils.sendErrorMessage(client, ctx, depositMessages.zeroBalance, color);
                }

                let amount = ctx.isInteraction ? ctx.interaction.options.getInteger('amount') : args[0];
                if (!amount || isNaN(amount) || amount < 1) {
                    const amountMap = {all: coin, half: Math.ceil(coin / 2)};
                    if (amount in amountMap) {
                        amount = amountMap[amount];
                    } else {
                        return ctx.sendMessage({
                            embeds: [
                                client.embed().setColor(color.red).setDescription(depositMessages.invalidAmount)
                            ],
                        });
                    }
                }

                const baseCoins = Math.min(amount, coin);
                const newCoin = coin - baseCoins;
                const newBank = bank + baseCoins;

                user.balance.coin = newCoin;
                user.balance.bank = newBank;
                user.save();

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        depositMessages.success
                            .replace('%{coinEmote}', emoji.coin)
                            .replace('%{amount}', client.utils.formatNumber(baseCoins))
                    );

                return ctx.sendMessage({embeds: [embed]});
            })
        } catch (error) {
            console.error('Error in Deposit command:', error);
            return client.utils.sendErrorMessage(client, ctx, depositMessages.errors.fetchFail, color);
        }
    }
};

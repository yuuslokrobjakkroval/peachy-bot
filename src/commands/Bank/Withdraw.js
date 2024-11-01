const { Command } = require('../../structures');
const Users = require("../../schemas/user.js");
const emojiImage = require("../../utils/Emoji");

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
        const withdrawMessages = language.locales.get(language.defaultLocale)?.economyMessages?.withdrawMessages; // Access messages
        const user = await Users.findOne({ userId: ctx.author.id });
        const verify = user.verification.verify.status === 'verified';

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, withdrawMessages.noUser, color);
        }

        const { coin, bank } = user.balance;

        if (bank < 1) {
            return await client.utils.sendErrorMessage(client, ctx, withdrawMessages.zeroBalance, color);
        }

        let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || bank : args[0] || bank;
        if (isNaN(amount) || amount < 1 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: bank, half: Math.ceil(bank / 2) };

            if (amount in amountMap) {
                amount = amountMap[amount];
            } else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(withdrawMessages.invalidAmount),
                    ],
                });
            }
        }

        const baseCoins = parseInt(Math.min(amount, bank));

        if (baseCoins > bank) {
            return await client.utils.sendErrorMessage(client, ctx, withdrawMessages.tooHigh, color);
        }

        const newCoin = coin + baseCoins;
        const newBank = bank - baseCoins;

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                withdrawMessages.success
                    .replace('{{coinEmote}}', emoji.coin)
                    .replace('{{amount}}', client.utils.formatNumber(baseCoins)))
            .setFooter({
                text: `Request By ${ctx.author.displayName}`,
                iconURL: verify ? client.utils.emojiToImage(emojiImage.verify) : ctx.author.displayAvatarURL(),
            });

        await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newCoin, 'balance.bank': newBank } }).exec();

        return await ctx.sendMessage({ embeds: [embed] });
    }
};

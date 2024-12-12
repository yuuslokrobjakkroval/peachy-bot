const { Command } = require('../../structures');

module.exports = class Withdraw extends Command {
    constructor(client) {
        super(client, {
            name: 'withdraw',
            description: {
                content: 'Withdraw currency coins from your bank.',
                examples: ['withdraw 100'],
                usage: 'withdraw <amount>',
            },
            category: 'bank',
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

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const withdrawMessages = language.locales.get(language.defaultLocale)?.bankMessages?.withdrawMessages;

        client.utils.getUser(ctx.author.id).then(user => {
            if (!user) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
            }

            const { coin, bank } = user.balance;

            if (bank < 1) {
                return client.utils.sendErrorMessage(client, ctx, withdrawMessages.zeroBalance, color);
            }

            let amount = ctx.isInteraction ? ctx.interaction.options.getInteger('amount') || 1 : args[0] || 1;

            if (amount.toString().startsWith('-')) {
                return ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.danger).setDescription(withdrawMessages.invalidAmount)
                    ],
                });
            }

            if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',') || amount.toString().startsWith('-')) {
                const amountMap = { all: bank, half: Math.ceil(bank / 2) };
                const multiplier = { k: 1000, m: 1000000, b: 1000000000 };

                if (amount in amountMap) {
                    amount = amountMap[amount];
                } else if (amount.match(/\d+[kmbtq]/i)) {
                    const unit = amount.slice(-1).toLowerCase();
                    const number = parseInt(amount);
                    amount = number * (multiplier[unit] || 1);
                } else {
                    return ctx.sendMessage({
                        embeds: [
                            client.embed().setColor(color.danger).setDescription(withdrawMessages.invalidAmount),
                        ],
                    });
                }
            }

            const baseCoins = Math.min(amount, bank);

            if (baseCoins > bank) {
                return client.utils.sendErrorMessage(client, ctx, withdrawMessages.tooHigh, color);
            }

            // Update user balance
            user.balance.coin += baseCoins ?? 0;
            user.balance.bank = bank - baseCoins;

            user.save()
                .then(() => {
                    const embed = client.embed()
                        .setColor(color.main)
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', "𝐖𝐈𝐓𝐇𝐃𝐑𝐀𝐖")
                                .replace('%{mainRight}', emoji.mainRight) +
                            withdrawMessages.success
                                .replace('%{amount}', client.utils.formatNumber(baseCoins))
                                .replace('%{coinEmote}', emoji.coin)
                        )
                        .setFooter({
                            text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                            iconURL: ctx.author.displayAvatarURL(),
                        });

                    return ctx.sendMessage({ embeds: [embed] });
                })
                .catch(error => {
                    console.error("Error saving user data:", error);
                    client.utils.sendErrorMessage(client, ctx, generalMessages.saveError, color);
                });
        }).catch(error => {
            console.error("Error retrieving user data:", error);
            client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
        });
    }
};

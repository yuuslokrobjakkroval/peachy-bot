const { Command } = require('../../structures');

module.exports = class Deposit extends Command {
    constructor(client) {
        super(client, {
            name: 'deposit',
            description: {
                content: 'Deposit currency coins to your bank.',
                examples: ['deposit 100'],
                usage: 'deposit <amount>',
            },
            category: 'bank',
            aliases: ['dep'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [{ name: 'amount', description: 'The amount you want to deposit.', type: 4, required: true }],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const depositMessages = language.locales.get(language.defaultLocale)?.bankMessages?.depositMessages;

        client.utils.getUser(ctx.author.id)
            .then(user => {
                if (!user) {
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.userNotFound, color);
                }

                const { coin, bank } = user.balance;

                if (coin < 1) {
                    return client.utils.sendErrorMessage(client, ctx, depositMessages.zeroBalance, color);
                }

                let amount = ctx.isInteraction ? ctx.interaction.options.getInteger('amount') || 1 : args[0] || 1;
                if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',') || amount.toString().startsWith('-')) {
                    const amountMap = { all: coin, half: Math.ceil(coin / 2) };
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
                                client.embed().setColor(color.danger).setDescription(depositMessages.invalidAmount)
                            ],
                        });
                    }
                } else {
                    return ctx.sendMessage({
                        embeds: [
                            client.embed().setColor(color.danger).setDescription(depositMessages.invalidAmount)
                        ],
                    });
                }

                const baseCoins = Math.min(amount, coin);
                user.balance.coin -= baseCoins;
                user.balance.bank += baseCoins;

                user.save()
                    .then(() => {
                        const embed = client.embed()
                            .setColor(color.main)
                            .setDescription(
                                generalMessages.title
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{title}', "𝐃𝐄𝐏𝐎𝐒𝐈𝐓")
                                    .replace('%{mainRight}', emoji.mainRight) +
                                depositMessages.success
                                    .replace('%{mainLeft}', emoji.mainLeft)
                                    .replace('%{mainRight}', emoji.mainRight)
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
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
            });
    }
};

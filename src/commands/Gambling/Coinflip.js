const { Command } = require('../../structures/index.js');
const maxAmount = 250000;

module.exports = class Coinflip extends Command {
    constructor(client) {
        super(client, {
            name: 'coinflip',
            description: {
                content: "Flip a coin and let's see who's the lucky one after!",
                examples: ['coinflip 100 peach', 'coinflip 100 goma'],
                usage: 'coinflip <amount> <choice>',
            },
            category: 'gambling',
            aliases: ['flip', 'cf'],
            cooldown: 3,
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
                    description: 'The amount you want to bet.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'choice',
                    description: 'The side you want to bet',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'peach', value: 'p' },
                        { name: 'goma', value: 'g' },
                    ],
                },
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const coinflipMessages = language.locales.get(language.defaultLocale)?.gamblingMessages?.coinflipMessages;
        client.utils.getUser(ctx.author.id).then(user => {
            const { coin, bank } = user.balance;

            if (coin < 1) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
            }

            let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
            if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
                const amountMap = {all: coin, half: Math.ceil(coin / 2)};
                if (amount in amountMap) {
                    amount = amountMap[amount];
                } else {
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.invalidAmount, color);
                }
            }

            const baseCoins = parseInt(Math.min(amount, coin, maxAmount));

            // ===================================== > Choice < ===================================== \\
            let choice = ctx.isInteraction ? ctx.interaction.options.getString('choice') : args[1];
            if (!choice) {
                return client.utils.sendErrorMessage(client, ctx, coinflipMessages.invalidChoice, color);
            }

            if (choice.toLowerCase() === 'peach' || choice.toLowerCase() === 'p') choice = 'p';
            else if (choice.toLowerCase() === 'goma' || choice.toLowerCase() === 'g') choice = 'g';

            let rand = client.utils.getRandomNumber(0, 1);
            let win = false;
            if (rand === 0 && choice === 'g') win = true;
            else if (rand === 1 && choice === 'p') win = true;

            // ===================================== > Display < ===================================== \\
            const flipEmbed = client.embed()
                .setColor(color.main)
                .setThumbnail(client.utils.emojiToImage(emoji.coinFlip.flip))
                .setDescription(
                    generalMessages.title
                        .replace('%{mainLeft}', emoji.mainLeft)
                        .replace('%{title}', coinflipMessages.title)
                        .replace('%{mainRight}', emoji.mainRight) +
                    coinflipMessages.description
                        .replace('%{coinEmote}', emoji.coin)
                        .replace('%{coin}', client.utils.formatNumber(baseCoins))
                        .replace('%{choice}', choice === 'p' ? '𝑷𝒆𝒂𝒄𝒉' : '𝑮𝒐𝒎𝒂')
                )
                .setFooter({
                    text: generalMessages.gameInProgress.replace('%{user}', ctx.author.displayName),
                    iconURL: ctx.author.displayAvatarURL(),
                })

            ctx.sendDeferMessage({embeds: [flipEmbed]});

            user.balance.coin = win ? coin + baseCoins : coin - baseCoins;
            user.balance.bank = bank;

            user.save().then(() => {
                // ===================================== > Result < ===================================== \\
                setTimeout(function () {
                    const resultCoin = win ? baseCoins * 2 : baseCoins;
                    const resultEmbed = client.embed()
                        .setColor(color.main)
                        .setThumbnail(client.utils.emojiToImage(win ? (choice === 'p' ? emoji.coinFlip.peach : emoji.coinFlip.goma) : (choice === 'p' ? emoji.coinFlip.goma : emoji.coinFlip.peach)))
                        .setDescription(
                            generalMessages.title
                                .replace('%{mainLeft}', emoji.mainLeft)
                                .replace('%{title}', coinflipMessages.title)
                                .replace('%{mainRight}', emoji.mainRight) +
                            coinflipMessages.result
                                .replace('%{coin}', client.utils.formatNumber(baseCoins))
                                .replace('%{coinEmote}', emoji.coin)
                                .replace('%{choice}', choice === 'p' ? '𝑷𝒆𝒂𝒄𝒉' : '𝑮𝒐𝒎𝒂')
                                .replace('%{result}', win ? '𝒘𝒐𝒏' : '𝒍𝒐𝒔𝒕')
                                .replace('%{resultCoin}', client.utils.formatNumber(resultCoin))
                                .replace('%{coinEmote}', emoji.coin)
                        )
                        .setFooter({
                            text: generalMessages.gameOver.replace('%{user}', ctx.author.displayName),
                            iconURL: ctx.author.displayAvatarURL(),
                        })

                    ctx.editMessage({embeds: [resultEmbed]});
                }, 2000);
            })
        }).catch(error => {
                console.error('Error processing command:', error);
                return client.utils.sendErrorMessage(client, ctx, generalMessages.userFetchError, color);
            });
    }
};

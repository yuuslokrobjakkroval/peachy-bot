const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const random = require('random-number-csprng');
const maxAmount = 250000;

module.exports = class Coinflip extends Command {
    constructor(client) {
        super(client, {
            name: 'coinflip',
            description: {
                content: "Flip a coin and let's see who's the lucky one after!",
                examples: ['coinflip peach 100', 'coinflip goma 100'],
                usage: 'coinflip <amount> <choice>',
            },
            category: 'gambling',
            aliases: ['flip', 'cf'],
            cooldown: 5,
            args: false,
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
                    type: 10,
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

        client.utils.getUser(ctx.author.id).then(user => {
            const { coin, bank } = user.balance;

            if (coin < 1) {
                return client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
            }

            // Get the amount and choice from the interaction or args
            let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
            let choice = ctx.isInteraction ? ctx.interaction.options.data[1]?.value.toString() : args[1] || 'p';
            choice = choice.toLowerCase();

            // Validate amount
            if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
                const amountMap = { all: coin, half: Math.ceil(coin / 2) };
                if (amount in amountMap) {
                    amount = amountMap[amount];
                } else {
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.invalidAmount, color);
                }
            }

            const baseCoins = Math.min(parseInt(amount), coin, maxAmount);

            // Display initial flip embed
            const flipEmbed = client.embed()
                .setColor(color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`# **${emoji.mainLeft} 𝐂𝐎𝐈𝐍𝐅𝐋𝐈𝐏 ${emoji.mainRight}**\n**${ctx.author.displayName}** bet **\`${baseCoins.toLocaleString()}\` ${emoji.coin}** and chose **${
                    choice === 'p' ? 'peach' : 'goma'
                }**.\nThe coin is flipping ${emoji.coinFlip.flip}...`)
                .setFooter({
                    text: `${ctx.author.displayName}, your game is in progress!`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            ctx.sendDeferMessage({ embeds: [flipEmbed] });

            // Get random result for the coinflip
            random(0, 1).then(rand => {
                const win = (rand === 0 && choice === 'g') || (rand === 1 && choice === 'p');
                const newBalance = win ? coin + baseCoins : coin - baseCoins;

                // Update the user's balance based on the outcome
                Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec().then(() => {

                    // Display result after 2 seconds to simulate coin flip animation
                    setTimeout(() => {
                        const resultEmbed = client.embed()
                            .setColor(win ? color.green : color.red)
                            .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                            .setDescription(`# **${emoji.mainLeft} 𝐂𝐎𝐈𝐍𝐅𝐋𝐈𝐏 ${emoji.mainRight}**\n**${ctx.author.displayName}** bet **\`${baseCoins.toLocaleString()}\`** ${emoji.coin} and chose **${
                                choice === 'p' ? 'peach' : 'goma'
                            }**.\nThe coin flipped ${
                                win ? (choice === 'p' ? emoji.coinFlip.peach : emoji.coinFlip.goma) : (choice === 'p' ? emoji.coinFlip.goma : emoji.coinFlip.peach)
                            } and you **${win ? `won \`${(baseCoins * 2).toLocaleString()}\` ${emoji.coin}` : `lost \`${baseCoins.toLocaleString()}\` ${emoji.coin}`}**!`)
                            .setFooter({
                                text: `${ctx.author.displayName}, your game is over.`,
                                iconURL: ctx.author.displayAvatarURL(),
                            });

                        ctx.editMessage({ embeds: [resultEmbed] });
                    }, 2000);
                }).catch(err => {
                    console.error('Error updating user balance:', err);
                    client.utils.sendErrorMessage(client, ctx, generalMessages.databaseError, color);
                });
            }).catch(err => {
                console.error('Error generating random number:', err);
                client.utils.sendErrorMessage(client, ctx, generalMessages.randomError, color);
            });
        }).catch(err => {
            console.error('Error fetching user:', err);
            client.utils.sendErrorMessage(client, ctx, generalMessages.fetchFail, color);
        });
    }
};

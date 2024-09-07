const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

const maxAmount = 250000;
const random = require('random-number-csprng');

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

    async run(client, ctx, args, language) {
        const user = await Users.findOne({ userId: ctx.author.id }).exec();
        const { coin, bank } = user.balance;
        if (coin < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'));

        let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: coin, half: Math.ceil(coin / 2) };
            if (amount in amountMap) amount = amountMap[amount];
            else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(client.color.red).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
                    ],
                });
            }
        }

        const baseCoins = parseInt(Math.min(amount, coin, maxAmount));

        // ===================================== > Choice < ===================================== \\
        let choice = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString() || 'p' : args[1] || 'p';
        if (choice !== undefined) choice = choice.toLowerCase();
        else if (choice === 'peach' || choice === 'p') choice = 'p';
        else if (choice === 'goma' || choice === 'g') choice = 'g';

        let rand = await random(0, 1);
        let win = false;
        if (rand === 0 && choice === 'g') win = true;
        else if (rand === 1 && choice === 'p') win = true;

        // ===================================== > Display < ===================================== \\
        const flipEmbed = client.embed()
            .setColor(client.color.main)
            .setTitle(`**${client.emoji.mainLeft} 𝐂𝐎𝐈𝐍𝐅𝐋𝐈𝐏 ${client.emoji.mainRight}**`)
            .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`**${ctx.author.displayName}** spent **\`${baseCoins.toLocaleString()}\` ${client.emoji.coin}** choose **${
                choice === 'p' ? 'Peach' : 'Goma'
            }**
The coin is flips ${client.emoji.coinFlip.flip}`)
            .setFooter({
                text: 'Game in progress',
                iconURL: client.utils.emojiToImage(`${client.emoji.main}`),
            })

        await ctx.sendDeferMessage({ embeds: [flipEmbed] });

        const newBalance = win ? coin + baseCoins : coin - baseCoins;
        await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();

        // ===================================== > Result < ===================================== \\
        setTimeout(async function () {
            const resultEmbed = client.embed()
                .setColor(client.color.main)
                .setTitle(`**${client.emoji.mainLeft} 𝐂𝐎𝐈𝐍𝐅𝐋𝐈𝐏 ${client.emoji.mainRight}**`)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`**${ctx.author.displayName}** spent **\`${baseCoins.toLocaleString()}\`** ${client.emoji.coin} choose **${
                    choice === 'p' ? 'Peach' : 'Goma'
                }**
The coin is flips ${win ? (choice === 'p' ? client.emoji.coinFlip.peach : client.emoji.coinFlip.goma) : choice === 'p' ? client.emoji.coinFlip.goma : client.coinFlip.emoji.peach} and ${
                    win
                        ? `**Won \`${(baseCoins + baseCoins).toLocaleString()}\` ${client.emoji.coin}**`
                        : `**Lose \`${baseCoins.toLocaleString()}\` ${client.emoji.coin}**`
                }`)
                .setFooter({
                    text: 'Game Over',
                    iconURL: client.utils.emojiToImage(`${client.emoji.main}`),
                })

            await ctx.editMessage({ embeds: [resultEmbed] });
        }, 2000);
    }
};


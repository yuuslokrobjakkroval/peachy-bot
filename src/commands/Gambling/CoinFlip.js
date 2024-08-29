const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/User.js');
const emoji = require('../../utils/Emoji.js');

const maxAmount = 250000;
const random = require('random-number-csprng');

module.exports = class Coinflip extends Command {
    constructor(client) {
        super(client, {
            name: 'coinflip',
            description: {
                content: "Flip a coin and let's see who's the lucky one after!",
                examples: ['coinflip head 100'],
                usage: 'coinflip <amount> <choice>',
            },
            category: 'gambling',
            aliases: ['flip', 'cf'],
            cooldown: 15,
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
                        { name: 'heads', value: 'h' },
                        { name: 'tails', value: 't' },
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
        let choice = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString() || 'h' : args[1] || 'h';
        if (choice !== undefined) choice = choice.toLowerCase();
        else if (choice === 'heads' || choice === 'h' || choice === 'head') choice = 'h';
        else if (choice === 'tails' || choice === 't' || choice === 'tail') choice = 't';

        let rand = await random(0, 1);
        let win = false;
        if (rand == 0 && choice == 't') win = true;
        else if (rand == 1 && choice == 'h') win = true;

        // ===================================== > Display < ===================================== \\
        const content = `**${ctx.author.displayName}** spent **\`${baseCoins.toLocaleString()}\` ${client.emote.coin}** choose **${
            choice === 'h' ? 'heads' : 'tails'
        }**
The coin is flips ${emoji.coinFlipSpin}`;

        const newBalance = win ? coin + baseCoins : coin - baseCoins;
        await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();

        await ctx.sendDeferMessage({ content: content });
        setTimeout(async function () {
            const content = `**${ctx.author.displayName}** spent **\`${baseCoins.toLocaleString()}\`** ${client.emote.coin} choose **${
                choice === 'h' ? 'heads' : 'tails'
            }**
The coin is flips ${win ? (choice == 'h' ? emoji.heads : emoji.tails) : choice == 'h' ? emoji.tails : emoji.heads} and ${
                win
                    ? `won **\`${(baseCoins + baseCoins).toLocaleString()}\`** ${client.emote.coin}`
                    : `lose **\`${baseCoins.toLocaleString()}\`** ${client.emote.coin}`
            }`;

            return await ctx.editMessage({ content: content });
        }, 2000);
    }
};
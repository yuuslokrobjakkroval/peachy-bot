const { Command } = require("../../structures");
const { COIN } = require('../../utils/Emoji.js');
const Currency = require("../../schemas/user");

const maxBet = 250000;

class Coinflip extends Command {
    constructor(client) {
        super(client, {
            name: "coinflip",
            description: {
                content: "Flip a coin for a chance to win coin!",
                examples: ["cf 1000", "cf all"],
                usage: "cf <amount> [heads/tails]",
            },
            category: "gamble",
            aliases: ["coinflip", "cf"],
            cooldown: 3,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'amount',
                    description: 'The amount of money to bet',
                    type: 'INTEGER',
                    required: true,
                },
                {
                    name: 'side',
                    description: 'The side of the coin to bet on (heads or tails)',
                    type: 'STRING',
                    required: false,
                }
            ],
        });
    }

    async run(client, ctx, args) {
        const userId = ctx.author.id;
        let user = await Currency.findOne({ userId });

        if (!user) {
            user = new Currency({ userId, balance: 0 });
        }

        const betAmount = parseInt(args[0], 10);
        const side = args[1] ? args[1].toLowerCase() : '';

        if (isNaN(betAmount) || betAmount <= 0) {
            return ctx.reply('Please specify a valid bet amount.');
        }

        if (betAmount > user.balance) {
            return ctx.reply(`You do not have enough ${COIN}.`);
        }

        if (side && side !== 'heads' && side !== 'tails') {
            return ctx.reply('Please specify either heads or tails.');
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        let description = `You flipped ${result}.`;

        if (side && result === side) {
            description += `\nYou won! 🎉 You earned ${betAmount} ${COIN}.`;
            user.balance += betAmount;
        } else {
            description += `\nYou lost. Better luck next time! 💸 You lost ${betAmount} ${COIN}.`;
            user.balance -= betAmount;
        }

        await user.save();

        const content = `Coinflip ` + description
        await ctx.sendMessage({ content: content });
    }
}

module.exports = Coinflip;

const { Command } = require("../../structures");
const Users = require("../../schemas/User");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { WHEEL, TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

class Roulette extends Command {
    constructor(client) {
        super(client, {
            name: "roulette",
            description: {
                content: "Bet on a number, color, or range in Roulette! Try to win based on the roulette wheel outcome!",
                examples: ["roulette red 1000", "roulette 17 500"],
                usage: "ROULETTE <number|color> <amount>",
            },
            category: "gamble",
            aliases: ["roulette", "roll"],
            cooldown: 1,
            args: true,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'bet',
                    description: 'Bet on a number (0-36), color (red/black), or range (1-18, 19-36)',
                    type: 'STRING',
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount of money to bet',
                    type: 'INTEGER',
                    required: true,
                }
            ],
        });
    }

    getRouletteResult() {
        const colors = ['red', 'black'];
        const numbers = Array.from({ length: 37 }, (_, i) => i); // Numbers 0-36
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        const color = number === 0 ? 'green' : (number % 2 === 0 ? 'black' : 'red');
        return { number, color };
    }

    async run(client, ctx, args) {
        let bet = args[0].toLowerCase();
        let amount = parseInt(args[1]);

        if (!/^\d+$/.test(bet) && !['red', 'black', 'green', '1-18', '19-36'].includes(bet)) {
            return ctx.sendMessage({ content: ", Invalid bet! Choose a number (0-36), color (red/black), or range (1-18, 19-36).", ephemeral: true });
        }

        if (isNaN(amount) || amount <= 0) {
            return ctx.sendMessage({ content: ", Please enter a valid amount to bet.", ephemeral: true });
        }

        if (amount > maxBet) {
            amount = maxBet;
        }

        const user = await Users.findOne({ userId: ctx.author.id });

        if (user.balance < amount) {
            return ctx.sendMessage({ content: '**🚫 | ' + ctx.author.globalName + "**, You don't have enough coins!", ephemeral: true });
        }

        // Spin the wheel
        const { number, color } = this.getRouletteResult();

        let win = 0;
        let winMessage = '';

        if (/^\d+$/.test(bet) && parseInt(bet) === number) {
            win = amount * 35; // Payout 35:1 for exact number
            winMessage = `You hit the number ${number}!`;
        } else if (['red', 'black'].includes(bet) && bet === color) {
            win = amount * 2; // Payout 1:1 for color
            winMessage = `You bet on ${color} and won!`;
        } else if (bet === 'green' && number === 0) {
            win = amount * 17; // Payout 17:1 for 0
            winMessage = `You bet on green and won!`;
        } else if (bet === '1-18' && number >= 1 && number <= 18) {
            win = amount * 2; // Payout 1:1 for range
            winMessage = `You bet on 1-18 and won!`;
        } else if (bet === '19-36' && number >= 19 && number <= 36) {
            win = amount * 2; // Payout 1:1 for range
            winMessage = `You bet on 19-36 and won!`;
        } else {
            winMessage = `You lost! The number was ${number} (${color}).`;
        }

        // Update user balance
        await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });

        let resultMsg = `**${TITLE} 𝐑𝐎𝐔𝐋𝐄𝐓𝐓𝐄 ${TITLE}**\n` +
                        `**Wheel result:** ${number} (${color})\n` +
                        `**You bet:** \`${numeral(amount).format()}\` ${COIN}\n` +
                        `**${winMessage}**\n` +
                        `**Result:** ${win > 0 ? `You won \`${numeral(win).format()}\` ${COIN}!` : `You lost \`${numeral(amount).format()}\``}`;

        await ctx.sendMessage({ content: resultMsg });
    }
}

module.exports = Roulette;

const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { DICE, TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

class Craps extends Command {
    constructor(client) {
        super(client, {
            name: "craps",
            description: {
                content: "Place your bet on the outcome of the dice roll in Craps!",
                examples: ["craps 1000"],
                usage: "CRAPS <amount>",
            },
            category: "gamble",
            aliases: ["craps", "dice"],
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
                    name: 'amount',
                    description: 'The amount of money to bet',
                    type: 'INTEGER',
                    required: true,
                }
            ],
        });
    }

    async rollDice() {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        return { die1, die2, total: die1 + die2 };
    }

    async run(client, ctx, args) {
        let amount = parseInt(args[0]);

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

        // Roll the dice
        const { die1, die2, total } = await this.rollDice();
        let win = 0;
        let winMessage = '';

        if (total === 7 || total === 11) {
            win = amount * 2; // Win on 7 or 11
            winMessage = `You rolled a ${total} and won!`;
        } else if (total === 2 || total === 3 || total === 12) {
            winMessage = `You rolled a ${total} and lost!`;
        } else {
            winMessage = `You rolled a ${total}. It's a draw!`;
        }

        // Update user balance
        await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });

        let resultMsg = `**${TITLE} 𝐂𝐑𝐀𝐏𝐒 ${TITLE}**\n` +
                        `**Dice roll:** ${DICE[die1]} ${DICE[die2]} (${total})\n` +
                        `**You bet:** \`${numeral(amount).format()}\` ${COIN}\n` +
                        `**${winMessage}**\n` +
                        `**Result:** ${win > 0 ? `You won \`${numeral(win).format()}\` ${COIN}!` : `You lost \`${numeral(amount).format()}\``}`;

        await ctx.sendMessage({ content: resultMsg });
    }
}

module.exports = Craps;

const { Command } = require("../../structures");
const Users = require("../../schemas/User");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { DICE, TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

class DiceRoll extends Command {
    constructor(client) {
        super(client, {
            name: "diceroll",
            description: {
                content: "Bet on a dice roll! Guess a number between 1 and 6 or a range to win!",
                examples: ["diceroll 3 1000", "diceroll 2-4 500"],
                usage: "DICEROLL <number|range> <amount>",
            },
            category: "gamble",
            aliases: ["diceroll", "roll", "dr"],
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
                    name: 'guess',
                    description: 'Guess a number between 1 and 6 or a range (e.g., 2-4)',
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

    async run(client, ctx, args) {
        let guess = args[0].toLowerCase();
        let amount = parseInt(args[1]);

        if (!/^\d{1,2}-\d{1,2}$/.test(guess) && !/^\d$/.test(guess)) {
            return ctx.sendMessage({ content: ", Invalid guess! Enter a number between 1 and 6 or a range (e.g., 2-4).", ephemeral: true });
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

        // Roll the dice
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        let win = 0;
        let guessRange = guess.split('-').map(num => parseInt(num));

        if (guessRange.length === 2) {
            if (diceRoll >= guessRange[0] && diceRoll <= guessRange[1]) {
                win = amount * 2; // Win 2x if the roll is within the range
            }
        } else if (parseInt(guess) === diceRoll) {
            win = amount * 6; // Win 6x if the exact number is guessed
        }

        let resultMsg = `**${TITLE} 𝐃𝐈𝐂𝐄 𝐑𝐎𝐋𝐋 ${TITLE}**\n` +
                        `**\`[\` ${diceRoll} \`]\`** ** ${ctx.author.displayName} ** \n` +
                        `**\`|        |\` You bet \`${numeral(amount).format()}\` ${COIN}**\n` +
                        `**\`|        |\`**`;

        await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });
        await ctx.sendMessage({ content: resultMsg });

        let winMsg = win > 0 ? `You won \`${numeral(win).format()}\` ${COIN}!` : `You lost \`${numeral(amount).format()}\``;
        setTimeout(async function () {
            await ctx.sendMessage({ content: `${resultMsg}\n**\`|        |\`** ${winMsg}` });
        }, 1000);
    }
}

module.exports = DiceRoll;

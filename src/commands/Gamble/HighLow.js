const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { CARD_BACK, TITLE } = require("../../utils/Emoji");

// Card values and suits
const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const cardValueMap = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};
const maxBet = 250000;

class HighLow extends Command {
    constructor(client) {
        super(client, {
            name: "highlow",
            description: {
                content: "Bet on whether the next card will be higher or lower than the current card!",
                examples: ["highlow high 1000"],
                usage: "HIGHLOW <high|low> <amount>",
            },
            category: "gamble",
            aliases: ["highlow", "hl"],
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
                    description: 'Guess if the next card will be high or low',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'high', value: 'high' },
                        { name: 'low', value: 'low' }
                    ]
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

    getRandomCard() {
        return cardValues[Math.floor(Math.random() * cardValues.length)];
    }

    async run(client, ctx, args) {
        let guess = args[0].toLowerCase();
        let amount = parseInt(args[1]);

        if (!['high', 'low'].includes(guess)) {
            return ctx.sendMessage({ content: ", Invalid guess! Choose 'high' or 'low'.", ephemeral: true });
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

        // Draw cards
        const currentCard = this.getRandomCard();
        const nextCard = this.getRandomCard();
        const currentValue = cardValueMap[currentCard];
        const nextValue = cardValueMap[nextCard];

        let win = 0;
        let winMessage = '';

        if ((guess === 'high' && nextValue > currentValue) || (guess === 'low' && nextValue < currentValue)) {
            win = amount * 2; // Win if guess is correct
            winMessage = `You guessed ${guess} and the next card was ${nextCard}!`;
        } else {
            winMessage = `You guessed ${guess}, but the next card was ${nextCard}.`;
        }

        // Update user balance
        await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: win - amount } });

        let resultMsg = `**${TITLE} 𝐇𝐈𝐆𝐇-𝐋𝐎𝐖 ${TITLE}**\n` +
                        `**Current card:** ${currentCard}\n` +
                        `**Next card:** ${nextCard}\n` +
                        `**You bet:** \`${numeral(amount).format()}\` ${COIN}\n` +
                        `**${winMessage}**\n` +
                        `**Result:** ${win > 0 ? `You won \`${numeral(win).format()}\` ${COIN}!` : `You lost \`${numeral(amount).format()}\``}`;

        await ctx.sendMessage({ content: resultMsg });
    }
}

module.exports = HighLow;

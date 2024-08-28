const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { CARD_BACK, TITLE } = require("../../utils/Emoji");

// Define card values
const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};

const maxBet = 250000;

class Blackjack extends Command {
    constructor(client) {
        super(client, {
            name: "blackjack",
            description: {
                content: "Play a game of Blackjack! Try to get as close to 21 as possible without going over.",
                examples: ["blackjack 1000"],
                usage: "BLACKJACK <amount>",
            },
            category: "gamble",
            aliases: ["blackjack", "bj"],
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

    getCard() {
        const cards = Object.keys(cardValues);
        return cards[Math.floor(Math.random() * cards.length)];
    }

    getHandValue(hand) {
        let value = 0;
        let numAces = 0;
        
        hand.forEach(card => {
            value += cardValues[card];
            if (card === 'A') numAces++;
        });

        while (value > 21 && numAces > 0) {
            value -= 10;
            numAces--;
        }
        
        return value;
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

        // Deal cards
        let userHand = [this.getCard(), this.getCard()];
        let dealerHand = [this.getCard(), this.getCard()];
        
        let userValue = this.getHandValue(userHand);
        let dealerValue = this.getHandValue(dealerHand);

        let gameResult = '';
        
        // User's turn
        let userTurn = true;
        while (userTurn) {
            let content = `**${TITLE} 𝐁𝐋𝐀𝐂𝐊𝐉𝐀𝐂𝐊 ${TITLE}**\n` +
                          `**Your hand:** ${userHand.join(' ')} (${userValue})\n` +
                          `**Dealer's hand:** ${dealerHand[0]} ${CARD_BACK}\n` +
                          `**You bet:** \`${numeral(amount).format()}\` ${COIN}\n` +
                          `**Do you want to (hit) or (stand)?**`;

            await ctx.sendMessage({ content: content });

            // Simulate user input (For demonstration. You should implement actual input handling)
            let userAction = Math.random() < 0.5 ? 'hit' : 'stand'; // Simulated choice

            if (userAction === 'hit') {
                userHand.push(this.getCard());
                userValue = this.getHandValue(userHand);
                if (userValue > 21) {
                    gameResult = 'bust';
                    break;
                }
            } else {
                userTurn = false;
            }
        }

        // Dealer's turn
        if (gameResult === '') {
            while (dealerValue < 17) {
                dealerHand.push(this.getCard());
                dealerValue = this.getHandValue(dealerHand);
            }

            // Determine the result
            if (dealerValue > 21 || userValue > dealerValue) {
                gameResult = 'win';
            } else if (userValue === dealerValue) {
                gameResult = 'draw';
            } else {
                gameResult = 'lose';
            }
        }

        let winAmount = 0;
        if (gameResult === 'win') {
            winAmount = amount * 2;
        } else if (gameResult === 'draw') {
            winAmount = amount;
        }

        // Update user balance
        await Users.updateOne({ userId: ctx.author.id }, { $inc: { balance: winAmount - amount } });

        let resultMsg = `**${TITLE} 𝐁𝐋𝐀𝐂𝐊𝐉𝐀𝐂𝐊 ${TITLE}**\n` +
                        `**Your hand:** ${userHand.join(' ')} (${userValue})\n` +
                        `**Dealer's hand:** ${dealerHand.join(' ')} (${dealerValue})\n` +
                        `**You bet:** \`${numeral(amount).format()}\` ${COIN}\n` +
                        `**Result:** ${gameResult === 'bust' ? 'You busted!' : gameResult === 'win' ? 'You won!' : gameResult === 'draw' ? 'It\'s a draw!' : 'You lost!'}`;

        await ctx.sendMessage({ content: resultMsg });
    }
}

module.exports = Blackjack;

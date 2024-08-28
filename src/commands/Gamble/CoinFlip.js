const { Command } = require("../../structures");
const Users = require("../../schemas/user");
const numeral = require("numeral");
const random = require("random-number-csprng");
const { COIN, TITLE } = require("../../utils/Emoji");

const maxBet = 250000;

class CoinFlip extends Command {
    constructor(client) {
        super(client, {
            name: "coinflip",
            description: {
                content: "Bet on a coin flip! Guess heads or tails to double your money!",
                examples: ["coinflip heads 1000", "coinflip tails 500"],
                usage: "COINFLIP <heads|tails> <amount>",
            },
            category: "gamble",
            aliases: ["coinflip", "flip", "cf"],
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
                    name: 'side',
                    description: 'Choose heads or tails',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'Heads', value: 'heads' },
                        { name: 'Tails', value: 'tails' },
                    ],
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
        let side = args[0].toLowerCase();
        let amount = parseInt(args[1]);

        if (side !== 'heads' && side !== 'tails') {
            return ctx.sendMessage({ content: ", Invalid side! Choose 'heads' or 'tails'.", ephemeral: true });
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

        // Flip the coin
        const coinSide = (await random(0, 1)) === 0 ? 'heads' : 'tails';
        const win = side === coinSide ? amount * 2 : 0;

        let resultMsg = `**${TITLE} 𝐂𝐎𝐈𝐍 𝐅𝐋𝐈𝐏 ${TITLE}**\n` +
                        `**\`[\` ${coinSide.toUpperCase()} \`]\`** ** ${ctx.author.displayName} ** \n` +
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

module.exports = CoinFlip;

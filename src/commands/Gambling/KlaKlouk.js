const { Command } = require('../../structures/index.js');
const kkUtil = require("../../utils/KlaKloukUtil");

const maxAmount = 300000;
const activeGames = new Map();

async function resetActiveGameState(userId) {
    if (activeGames.has(userId)) {
        activeGames.delete(userId);
    }
}

module.exports = class Klalouk extends Command {
    constructor(client) {
        super(client, {
            name: 'klaklouk',
            description: {
                content: 'Play the Kla Klouk game and see if you can win!',
                examples: ['kk 1000 5'],
                usage: 'kk <amount> player',
            },
            category: 'gambling',
            aliases: ['kk'],
            cooldown: 4,
            args: true,
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
                    type: 3,
                    required: true,
                },
                // {
                //     name: 'player',
                //     description: 'The amount you want to play together.',
                //     type: 4,
                //     required: false,
                // },
                {
                    name: "user",
                    description: "The user to get for reset game",
                    type: 6,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const klaKloukMessages = language.locales.get(language.defaultLocale)?.gamblingMessages?.klaKloukMessages;
        try {
            client.utils.getUser(ctx.author.id).then(user => {
                const { coin } = user.balance;

                if (coin < 1) {
                    activeGames.delete(ctx.author.id);
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.zeroBalance, color);
                }

                let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
                if (amount.toString().startsWith('-')) {
                    activeGames.delete(ctx.author.id);
                    return ctx.sendMessage({
                        embeds: [
                            client.embed().setColor(color.danger).setDescription(generalMessages.invalidAmount)
                        ],
                    });
                }

                if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
                    const amountMap = {all: coin, half: Math.ceil(coin / 2)};
                    if (amount in amountMap) {
                        amount = amountMap[amount];
                    } else {
                        return client.utils.sendErrorMessage(client, ctx, generalMessages.invalidAmount, color);
                    }
                }

                const targetUser = ctx.isInteraction ? ctx.options.getUser('user') : ctx.message.mentions.users.first() || ctx.guild.members.cache.get(args[1]) || ctx.author;
                resetActiveGameState(targetUser.id);
                if (activeGames.has(ctx.author.id)) {
                    return client.utils.sendErrorMessage(client, ctx, generalMessages.alreadyInGame, color);
                }
                activeGames.set(ctx.author.id, true);

                const betCoins = parseInt(Math.min(amount, coin, maxAmount));
                // let player = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;

                // if (player > 1) {
                //     const startEmbed = client.embed()
                //         .setColor(color.main)
                //         .setDescription(
                //             generalMessages.title
                //                 .replace('%{mainLeft}', emoji.mainLeft)
                //                 .replace('%{title}', klaKloukMessages.title)
                //                 .replace('%{mainRight}', emoji.mainRight) +
                //             klaKloukMessages.waiting.replace('%{player}', ctx.author.displayName))
                // } else {
                    return kkUtil.klakloukStarting(client, ctx, color, emoji, user, coin, betCoins, generalMessages, klaKloukMessages, activeGames)
                // }
            })
        } catch (error) {
            console.error(error);
        }
    }
};
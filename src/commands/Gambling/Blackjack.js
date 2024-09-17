const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const maxAmount = 250000;
const deck = Array.from({ length: 52 }, (_, i) => i + 1);
const bjUtil = require('../../utils/BlackjackUtil.js');
const Users = require('../../schemas/user');
const activeGames = new Map();

module.exports = class Cmd extends Command {
    constructor(client) {
        super(client, {
            name: 'blackjack',
            description: {
                content: '',
                examples: ['blackjack 100'],
                usage: 'blackjack <amount>',
            },
            category: 'gambling',
            aliases: ['bj'],
            cooldown: 10,
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
                    type: 3,
                    required: true,
                },
            ],
        });
    }
    async run(client, ctx, args, language) {
        const user = await Users.findOne({ userId: ctx.author.id }).exec();
        if (activeGames.has(ctx.author.id)) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                'You are already in a game. Please finish your current game before starting a new one.'
            );
        }

        const { coin, bank } = user.balance;
        if (coin < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'));

        let amount = ctx.isInteraction ? ctx.interaction.options.data[0]?.value || 1 : args[0] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: coin, half: Math.ceil(coin / 2) };
            if (amount in amountMap) amount = amountMap[amount];
            else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(client.color.danger).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
                    ],
                });
            }
        }

        const baseCoins = parseInt(Math.min(amount, coin, maxAmount));
        const newBalance = coin - baseCoins;
        await Users.updateOne({ userId: ctx.author.id }, { $set: { 'balance.coin': newBalance, 'balance.bank': bank } }).exec();
        activeGames.set(ctx.author.id, true);

        return await initBlackjack(ctx, client, baseCoins);
    }
};

async function initBlackjack(ctx, client, bet) {
    let tdeck = deck.slice(0);
    let player = [await bjUtil.randCard(tdeck, 'f'), await bjUtil.randCard(tdeck, 'f')];
    let dealer = [await bjUtil.randCard(tdeck, 'f'), await bjUtil.randCard(tdeck, 'b')];

    await blackjack(ctx, client, player, dealer, bet);
}

async function blackjack(ctx, client, player, dealer, bet) {
    let embed = bjUtil.generateEmbed(ctx.author, client, dealer, player, bet);

    let row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(1),
        new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(2)
    );

    const msg = await ctx.sendMessage({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
        filter: async int => {
            if (int.user.id === ctx.author.id) return true;
            else {
                await int.reply({ ephemeral: true, content: `This button is controlled by **${ctx.author.displayName}**!` });
                return false;
            }
        },
        time: 60000,
    });

    collector.on('collect', async int => {
        if (int.customId === 'hit') {
            await int.deferUpdate();
            await hit(int, client, player, dealer, msg, bet, collector);
        } else if (int.customId === 'stand') {
            await int.deferUpdate();
            collector.stop('done');
            await stop(int, client, player, dealer, msg, bet);
        }
    });

    collector.on('end', () => {
        activeGames.delete(ctx.author.id);
        msg.edit({ components: [new ActionRowBuilder().addComponents(row.components.map(c => c.setDisabled(true)))] });
    });
}

async function hit(int, client, player, dealer, msg, bet, collector) {
    let tdeck = bjUtil.initDeck(deck.slice(0), player, dealer);
    let card = await bjUtil.randCard(tdeck, 'f');
    player.push(card);

    // Recalculate points after drawing a new card
    let playerHand = bjUtil.cardValue(player);
    let ppoints = playerHand.points;

    if (ppoints >= 21) {
        collector.stop('done');
        await stop(int, client, player, dealer, msg, bet, true);
    } else {
        let embed = bjUtil.generateEmbed(int.user, client, dealer, player, bet);
        msg.edit({ embeds: [embed] });
    }
}

async function stop(int, client, player, dealer, msg, bet, fromHit) {
    if (!fromHit) player.forEach(card => (card.type = 'c'));
    dealer.forEach(card => {
        if (card.type == 'b') card.type = 'f';
        else card.type = 'c';
    });

    let playerHand = bjUtil.cardValue(player);
    let ppoints = playerHand.points;

    let dealerHand = bjUtil.cardValue(dealer);
    let dpoints = dealerHand.points;

    let tdeck = bjUtil.initDeck(deck.slice(0), player, dealer);

    while (dpoints < 17) {
        dealer.push(await bjUtil.randCard(tdeck, 'f'));
        dealerHand = bjUtil.cardValue(dealer);
        dpoints = dealerHand.points;
    }

    let winner;
    if (ppoints > 21 && dpoints > 21) winner = 'tb';
    else if (ppoints === dpoints) winner = 't';
    else if (ppoints > 21) winner = 'l';
    else if (dpoints > 21) winner = 'w';
    else if (ppoints > dpoints) winner = 'w';
    else winner = 'l';

    const user = await Users.findOne({ userId: int.user.id }).exec();

    const { coin } = user.balance;
    let newBalance;
    if (winner === 'w') newBalance = coin + bet * 2;
    else if (winner === 't' || winner === 'tb') newBalance = coin + bet;

    await Users.updateOne({ userId: int.user.id }, { $set: { 'balance.coin': newBalance } }).exec();

    let embed = bjUtil.generateEmbed(int.user, client, dealer, player, bet, winner, bet);

    activeGames.delete(int.user.id);
    msg.edit({
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Hit').setStyle(1).setDisabled(true),
                new ButtonBuilder().setCustomId('stand').setLabel('Stand').setStyle(2).setDisabled(true)
            ),
        ],
    });
}


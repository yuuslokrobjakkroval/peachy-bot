const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");
const ShopItems = require('../../assets/inventory/ShopItems');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Items = inventory.filter(value => value.price.buy !== 0).sort((a, b) => a.price.buy - b.price.buy);

module.exports = class Buy extends Command {
    constructor(client) {
        super(client, {
            name: 'buy',
            description: {
                content: 'Buy an item from the shop.',
                examples: ['buy TCM1'],
                usage: 'buy <item_id>',
            },
            cooldown: 5,
            category: 'inventory',
            aliases: [],
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'items',
                    description: 'The item you want to buy.',
                    type: 3,
                    required: false,
                },
                {
                    name: 'amount',
                    description: 'The amount of the item you want to buy.',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const user = await Users.findOne({ userId: ctx.author.id });
        const { coin, bank } = user.balance;
        if (coin < 1) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'zero_balance'), color);

        const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString().toLowerCase() : args[0].toLowerCase();
        const itemInfo = Items.find((item) => item.id === itemId);

        if (!itemInfo) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                client.i18n.get(language, 'commands', 'invalid_item', { itemId: args.join(' ') }),
                color
            );
        }

        // Check if the item is a theme and if the user already owns it
        if (itemInfo.type === 'theme') {
            const themeExists = user.inventory.find(invItem => invItem.id === itemId);
            if (themeExists) {
                return await client.utils.sendErrorMessage(
                    client,
                    ctx,
                    client.i18n.get(language, 'commands', 'theme_already_owned', { itemEmote: itemInfo.emoji, itemName: itemInfo.name }),
                    color
                );
            }
        }

        if (itemInfo.price.buy === 0) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                client.i18n.get(language, 'commands', 'buydisable', { itemEmote: itemInfo.emoji, itemName: itemInfo.name }),
                color
            );
        }

        if (itemInfo.price.buy > coin) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                client.i18n.get(language, 'commands', 'buy_afford', {
                    coinEmote: emoji.coin,
                    needCoin: itemInfo.price.buy - coin,
                    itemEmote: itemInfo.emoji,
                    itemName: itemInfo.name,
                }),
                color
            );
        }

        let maxAmountToBuy = Math.floor(coin / itemInfo.price.buy);
        let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;
        if (isNaN(amount) || amount < 1 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: coin, half: Math.ceil(coin / 2) };

            if (amount in amountMap) amount = amountMap[amount];
            else return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'invalid_amount'), color);
        }

        let totalPrice = Math.floor(itemInfo.price.buy * amount);
        let afford = true;

        if (totalPrice > coin) {
            totalPrice = itemInfo.price.buy * maxAmountToBuy;
            amount = maxAmountToBuy;
            afford = false;
        }

        const amountToBuy = parseInt(Math.min(amount, maxAmountToBuy));

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(
                client.i18n.get(language, 'commands', 'buy_description', {
                    afford: afford
                        ? client.i18n.get(language, 'commands', 'buy_successfully')
                        : client.i18n.get(language, 'commands', 'buy_afford_to_buy'),
                    itemEmote: itemInfo.emoji,
                    itemName: itemInfo.name,
                    coinEmote: emoji.coin,
                    totalPrice: client.utils.formatNumber(totalPrice),
                    amountToBuy,
                })
            );

        // Update user's inventory and balance
        const existingItem = user.inventory.find(invItem => invItem.id.toLowerCase() === itemId);

        if (existingItem) {
            await Users.updateOne(
                { userId: ctx.author.id, 'inventory.id': itemId },
                {
                    $inc: {
                        'balance.coin': -totalPrice,
                        'inventory.$.quantity': amountToBuy
                    },
                    $set: { 'balance.bank': bank }
                }
            ).exec();
        } else {
            await Users.updateOne(
                { userId: ctx.author.id },
                {
                    $inc: { 'balance.coin': -totalPrice },
                    $set: { 'balance.bank': bank },
                    $push: { inventory: { id: itemId, name: itemInfo.name, quantity: amountToBuy } }
                }
            ).exec();
        }

        return await ctx.sendMessage({ embeds: [embed] });
    }
};

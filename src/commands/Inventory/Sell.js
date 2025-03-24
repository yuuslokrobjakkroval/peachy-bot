const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const MoreItems = ShopItems.flatMap(shop => shop.inventory);
const AllItems = [...ImportantItems, ...MoreItems].filter(item => item.price.sell !== 0);

module.exports = class Sell extends Command {
    constructor(client) {
        super(client, {
            name: 'sell',
            description: {
                content: 'Sell an item from your inventory.',
                examples: ['sell coal', 'sell all'],
                usage: 'sell <item_id>',
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
            slashCommand: true,
            options: [
                { name: 'items', description: 'The item you want to sell.', type: 3, required: true },
                { name: 'amount', description: 'The amount of the item you want to sell.', type: 3, required: false },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const sellMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.sellMessages;

        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user || !user.inventory || user.inventory.length === 0) {
                return await client.utils.sendErrorMessage(client, ctx, sellMessages.inventoryEmpty, color);
            }

            const itemId = ctx.isInteraction ? ctx.interaction.options.getString('items') : args[0];
            const itemInfo = AllItems.find(item => item.id === itemId);
            const hasItems = user.inventory.find(item => item.id === itemId);

            if (itemInfo) {
                return await this.sellSingleItem(client, ctx, user, args, itemInfo, hasItems, color, emoji, sellMessages);
            }

            return await client.utils.sendErrorMessage(client, ctx, sellMessages.itemNotFound.replace('%{item}', itemId), color);
        } catch (error) {
            console.error('Error in Sell command:', error);
            return await client.utils.sendErrorMessage(client, ctx, sellMessages.sellError, color);
        }
    }

    async sellSingleItem(client, ctx, user, args, itemInfo, hasItems, color, emoji, sellMessages) {
        if (!hasItems || itemInfo.price.sell === 0) {
            const errorMessage = !hasItems
                ? sellMessages.itemNotOwned.replace('%{item}', itemInfo.name)
                : sellMessages.itemNotSellable.replace('%{item}', itemInfo.name);
            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        let quantity = ctx.isInteraction ? ctx.interaction.options.getString('amount') || 1 : args[1] || 1;
        quantity = this.parseQuantity(quantity, hasItems.quantity);

        if (quantity === null) {
            return await client.utils.sendErrorMessage(client, ctx, sellMessages.invalidQuantity, color);
        }

        const totalSalePrice = itemInfo.price.sell * quantity;
        const updatedUser = await Users.findOneAndUpdate(
            { userId: ctx.author.id, "inventory.id": itemInfo.id },
            {
                $inc: {
                    'balance.coin': totalSalePrice,
                    'inventory.$.quantity': -quantity
                }
            },
            { new: true }
        );

        if (updatedUser.inventory.find(item => item.id === itemInfo.id)?.quantity === 0) {
            await Users.updateOne(
                { userId: ctx.author.id },
                { $pull: { inventory: { id: itemInfo.id }, equip: { id: itemInfo.id } } }
            );
        }

        return await ctx.sendMessage({
            embeds: [
                client.embed()
                    .setColor(color.main)
                    .setDescription(
                        sellMessages.itemSold
                            .replace('{emoji}', itemInfo.emoji)
                            .replace('{quantity}', quantity)
                            .replace('{item}', itemInfo.name)
                            .replace('{coinEmoji}', emoji.coin)
                            .replace('{price}', client.utils.formatNumber(totalSalePrice))
                    )
            ]
        });
    }

    parseQuantity(input, maxQuantity) {
        const quantityMap = { all: maxQuantity, half: Math.ceil(maxQuantity / 2) };
        const quantity = quantityMap[input] || parseInt(input);

        return isNaN(quantity) || quantity <= 0 ? null : Math.min(quantity, maxQuantity);
    }
};
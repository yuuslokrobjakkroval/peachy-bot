const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Users = require("../../schemas/user");
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const {checkRank} = require("../../functions/function");
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
        try {
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user || !user.inventory || user.inventory.length === 0) {
                return client.utils.sendErrorMessage(client, ctx, 'Your inventory is empty.', color);
            }

            const itemId = ctx.isInteraction ? ctx.interaction.options.getString('items') : args[0];
            if (itemId.toLowerCase() === 'all') return this.sellAllItems(client, ctx, user, color);

            const itemInfo = AllItems.find(item => item.id === itemId);
            const itemType = AllItems.find(item => item.type === itemId);
            const hasItems = user.inventory.find(item => item.id === itemId);

            if (itemType) return this.sellItemsByType(client, ctx, user, itemType.type, color, emoji);
            if (itemInfo) return this.sellSingleItem(client, ctx, user, args, itemInfo, hasItems, color, emoji);

            return client.utils.sendErrorMessage(client, ctx, `The item with id \`${itemId}\` couldn't be found!`, color);
        } catch (error) {
            console.error('Error in Sell command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while processing your sell request.', color);
        }
    }

    async sellSingleItem(client, ctx, user, args, itemInfo, hasItems, color, emoji) {
        if (!hasItems || itemInfo.price.sell === 0) {
            const errorMessage = !hasItems
                ? `You don't have ${itemInfo.emoji} **${client.utils.toNameCase(itemInfo.id)}** in your inventory.`
                : `The item ${itemInfo.emoji} **${client.utils.toNameCase(itemInfo.id)}** is not sellable!`;
            return client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        let quantity = ctx.isInteraction ? ctx.interaction.options.getString('amount') || 1 : args[1] || 1;
        quantity = this.parseQuantity(quantity, hasItems.quantity);

        if (quantity === null) {
            return client.utils.sendErrorMessage(client, ctx, 'Invalid quantity specified.', color);
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

        return ctx.sendMessage({
            embeds: [
                client.embed().setColor(color.main).setDescription(
                    `You sold ${itemInfo.emoji} **\`${quantity}\`** ${itemInfo.name} for ${emoji.coin} **\`${client.utils.formatNumber(totalSalePrice)}\`** coins.`
                )
            ]
        });
    }

    async sellItemsByType(client, ctx, user, itemType, color, emoji) {
        const itemsToSell = user.inventory.filter(item => AllItems.some(x => x.id === item.id && x.type === itemType && x.price.sell !== 0));
        if (itemsToSell.length === 0) {
            return client.utils.sendErrorMessage(client, ctx, `You don't have any ${itemType} items in your inventory to sell.`, color);
        }

        const { totalPrice, soldItems } = this.calculateTotalPrice(itemsToSell);
        const embedDescription = this.buildSellDescription(client, soldItems);

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setStyle(3).setCustomId('accept').setLabel('Accept').setEmoji('✅'))
            .addComponents(new ButtonBuilder().setStyle(4).setCustomId('cancel').setLabel('Cancel').setEmoji('❌'));

        const msg = await ctx.sendMessage({
            embeds: [client.embed().setColor(color.main).setTitle(`${ctx.author.displayName}'s sell!`).setDescription(embedDescription)],
            components: [row],
        });

        this.handleButtonInteraction(client, ctx, msg, itemsToSell, totalPrice);
    }

    async sellAllItems(client, ctx, user, color) {
        const itemsToSell = user.inventory.filter(item => AllItems.some(x => x.id === item.id && x.price.sell !== 0));

        if (itemsToSell.length === 0) {
            return client.utils.sendErrorMessage(client, ctx, "You don't have any sellable items in your inventory.", color);
        }

        const { totalPrice, soldItems } = this.calculateTotalPrice(itemsToSell);
        const embedDescription = this.buildSellDescription(client, soldItems);

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setStyle(3).setCustomId('accept').setLabel('Accept').setEmoji('✅'))
            .addComponents(new ButtonBuilder().setStyle(4).setCustomId('cancel').setLabel('Cancel').setEmoji('❌'));

        const msg = await ctx.sendMessage({
            embeds: [client.embed().setColor(color.main).setTitle(`${ctx.author.displayName}'s sell!`).setDescription(embedDescription)],
            components: [row],
        });

        this.handleButtonInteraction(client, ctx, msg, itemsToSell, totalPrice);
    }

    parseQuantity(input, maxQuantity) {
        const quantityMap = { all: maxQuantity, half: Math.ceil(maxQuantity / 2) };
        const quantity = quantityMap[input] || parseInt(input);

        return isNaN(quantity) || quantity <= 0 ? null : Math.min(quantity, maxQuantity);
    }

    calculateTotalPrice(items) {
        let totalPrice = 0;
        const soldItems = {};

        items.forEach(item => {
            const itemInfo = AllItems.find(i => i.id === item.id && i.price.sell !== 0);
            const itemTotalPrice = itemInfo.price.sell * item.quantity;
            totalPrice += itemTotalPrice;

            if (!soldItems[itemInfo.rarity]) soldItems[itemInfo.rarity] = [];
            soldItems[itemInfo.rarity].push({ item: itemInfo, quantity: item.quantity });
        });

        return { totalPrice, soldItems };
    }

    buildSellDescription(client, soldItems) {
        let description = `\`╔══════╦══ •❃°•°❀°•°❃• ═╦══════╗\`\n\`║ ITEM ║ AMOUNT ║ TOTAL ║ RANK ║\`\n\`╠══════╬════════╬═══════╬══════╣\`\n`;

        Object.entries(soldItems)
            .sort(([rarityA], [rarityB]) => {
                const rarityOrder = ['legendary', 'epic', 'uncommon'];
                return rarityOrder.indexOf(rarityA.toLowerCase()) - rarityOrder.indexOf(rarityB.toLowerCase());
            })
            .forEach(([rarity, items]) => {
                items.forEach(soldItem => {
                    const { item, quantity } = soldItem;
                    const totalPrice = item.price.sell * quantity;
                    const itemName = item.emoji;
                    const amountStr = client.utils.formatNumber(quantity);
                    const rankEmoji = checkRank(item.rarity);

                    const itemPadding = ' '.repeat(Math.max(0, 6 - itemName.length));
                    const amountPadding = ' '.repeat(Math.max(0, 8 - amountStr.length));
                    const totalPadding = ' '.repeat(Math.max(0, 7 - totalPrice.length));

                    description += `\`║ \`   ${itemName}${itemPadding}   \` ║ ${amountStr}${amountPadding} ║ ${totalPrice}${totalPadding} ║ \`  ${rankEmoji}  \` ║\`\n`;
                });
            });

        return description + '`╚══════╩══ •❃°•°❀°•°❃• ═╩══════╝`';
    }

    handleButtonInteraction(client, ctx, msg, itemsToSell, totalPrice) {
        const collector = msg.createMessageComponentCollector({
            filter: interaction => interaction.user.id === ctx.author.id,
            time: 15000,
            max: 1,
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'accept') {
                await Users.findOneAndUpdate(
                    { userId: ctx.author.id },
                    {
                        $inc: { 'balance.coin': totalPrice },
                        $pull: { inventory: { id: { $in: itemsToSell.map(i => i.id) } }, equip: { id: { $in: itemsToSell.map(i => i.id) } } }
                    },
                    { new: true }
                );
                await interaction.update({
                    embeds: [client.embed().setColor(color.main).setDescription(`You sold your items for ${emoji.coin} **\`${client.utils.formatNumber(totalPrice)}\`** coins.`)],
                    components: [],
                });
            } else {
                await interaction.update({ content: 'Sell canceled.', components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                msg.edit({ content: '', components: [] });
            }
        });
    }
};

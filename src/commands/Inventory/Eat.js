const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const AllItems = ShopItems.flatMap(shop => shop.inventory);

module.exports = class Eat extends Command {
    constructor(client) {
        super(client, {
            name: 'eat',
            description: {
                content: 'Eat a food item to gain XP.',
                examples: ['eat bunble 1'],
                usage: 'eat <item> <amount>',
            },
            category: 'inventory',
            aliases: ['e'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'item',
                    description: 'The food item you want to eat.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount you want to eat.',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const eatMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.eatMessages;
        const authorId = ctx.author.id;
        const user = await Users.findOne({ userId: authorId });

        if (!user || user.inventory.length === 0) {
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.emptyInventory, color);
        }

        const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString() : args[0];
        const itemInfo = AllItems.find(({ id }) => id.toLowerCase() === itemId.toLowerCase());

        if (!itemInfo) {
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.itemNotFound.replace('%{itemId}', itemId), color);
        }

        if (itemInfo.type === 'drink') {
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.cannotEatDrink
                .replace('%{itemEmote}', itemInfo.emoji)
                .replace('%{itemName}', itemInfo.name), color);
        }

        if (itemInfo.type !== 'food' || itemInfo.type !== 'cake') {
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.notEdible, color);
        }

        const hasItems = user.inventory.find(item => item.id === itemId);
        if (!hasItems) {
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.noFoodItem, color);
        }

        let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.')) {
            return await client.utils.sendErrorMessage(client, ctx, eatMessages.invalidAmount, color);
        }

        const itemAmount = parseInt(Math.min(amount, hasItems.quantity));
        const xpGained = itemInfo.xp * itemAmount;

        // Consume item and gain XP
        if (hasItems.quantity - itemAmount === 0) {
            await Users.updateOne({ userId: authorId }, { $pull: { inventory: { id: itemId } } });
        } else {
            await Users.updateOne({ userId: authorId, 'inventory.id': itemId }, { $inc: { 'inventory.$.quantity': -itemAmount } });
        }

        await Users.updateOne({ userId: authorId }, { $inc: { 'profile.xp': xpGained } });

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                eatMessages.success
                    .replace('%{itemEmote}', itemInfo.emoji)
                    .replace('%{itemAmount}', itemAmount)
                    .replace('%{itemName}', itemInfo.name)
                    .replace('%{xpGained}', xpGained))
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        await ctx.sendMessage({ embeds: [embed] });
    }
};

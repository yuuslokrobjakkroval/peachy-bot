const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const AllItems = ShopItems.flatMap(shop => shop.inventory);

module.exports = class Drink extends Command {
    constructor(client) {
        super(client, {
            name: 'drink',
            description: {
                content: 'Drink an item to gain XP.',
                examples: ['drink tembo 1'],
                usage: 'drink <item> <amount>',
            },
            category: 'inventory',
            aliases: ['d', 'pherk'],
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
                    description: 'The drink item you want to drink.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount you want to drink.',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const authorId = ctx.author.id;
        const user = await Users.findOne({ userId: authorId });

        if (!user || user.inventory.length === 0) {
            return await client.utils.sendErrorMessage(client, ctx, 'Your inventory is empty.', color);
        }

        const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString() : args[0];
        const itemInfo = AllItems.find(({ id }) => id === itemId.toLowerCase());

        // Check if the item is food and return a message
        if (itemInfo.type === 'food') {
            return await client.utils.sendErrorMessage(client, ctx, `You can't drink ${itemInfo.emoji} **${itemInfo.name}**. It's food!`, color);
        }

        if (itemInfo.type !== 'drink') {
            return await client.utils.sendErrorMessage(client, ctx, `This item is not drinkable.`, color);
        }

        const hasItems = user.inventory.find(item => item.id === itemId);

        if (!itemInfo || !hasItems) {
            return await client.utils.sendErrorMessage(client, ctx, `You don't have this drink item.`, color);
        }

        let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.')) {
            return await client.utils.sendErrorMessage(client, ctx, 'Invalid amount.', color);
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

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(`You drank ${itemInfo.emoji} **\`x${itemAmount}\`** ${itemInfo.name} and gained **${xpGained} XP**.`);

        await ctx.sendMessage({ embeds: [embed] });
    }
};

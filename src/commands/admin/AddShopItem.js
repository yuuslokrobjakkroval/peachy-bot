const { Command } = require('../../structures/index.js');
const ShopItem = require('../../schemas/shopItem'); // Import the shop schema
const ShopItems = require('../../assets/inventory/ShopItems.js');
const AllItems = ShopItems.flatMap(shop => shop.inventory);

module.exports = class AddShopItem extends Command {
    constructor(client) {
        super(client, {
            name: 'addshopitem',
            description: {
                content: 'Add an item to the shop.',
                examples: ['addshopitem ocean_breeze'],
                usage: 'addshopitem <item>',
            },
            category: 'shop',
            aliases: ['additem', 'asi'],
            cooldown: 2,
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
                    description: 'The shop item you want to add to the shop inventory.',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString() : args[0].toLowerCase();
        const itemInfo = AllItems.find(({ id }) => id === itemId);

        if (!itemInfo) {
            return await client.utils.sendErrorMessage(client, ctx, 'Item not found in the shop inventory.', color);
        }

        // Check if the item already exists in the shop
        const existingItem = await ShopItem.findOne({ id: itemId });

        if (existingItem) {
            return await client.utils.sendErrorMessage(client, ctx, `The item **${itemInfo.name}** is already in the shop.`, color);
        }

        const newShopItem = new ShopItem({
            id: itemId,
            name: itemInfo.name,
            type: itemInfo.type,
            price: itemInfo.price,
            quantity: itemInfo.quantity,
            emoji: itemInfo.emoji,
            xp: itemInfo.xp,
            description: itemInfo.description,
            available: itemInfo.available,
            limit: itemInfo.limit || 0, // Set limit if exists
        });

        // Save the new item to the database
        await newShopItem.save();

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(`You successfully added ${itemInfo.emoji} **${itemInfo.name}** to the shop.`);

        await ctx.sendMessage({ embeds: [embed] });
    }
};

const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/User.js');
const ShopItem = require('../../schemas/ShopItem.js');

module.exports = class Sell extends Command {
    constructor(client) {
        super(client, {
            name: 'sell',
            description: {
                content: 'Sell items from your inventory.',
                examples: ['sell <itemName>'],
                usage: 'sell <itemName>',
            },
            category: 'economy',
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
        });
    }

    async run(client, ctx, args) {
        const itemName = args.join(' ').toLowerCase();
        const user = await Users.findOne({ userId: ctx.author.id });
        const item = await ShopItem.findOne({ name: itemName });

        if (!item) {
            return ctx.sendMessage('Item not found in shop.');
        }

        const inventoryItem = user.inventory.find(i => i.item === item.name);
        if (!inventoryItem || inventoryItem.quantity <= 0) {
            return ctx.sendMessage('You don’t have this item in your inventory.');
        }

        const sellPrice = Math.floor(item.price * 0.5); // Example: selling for 50% of the buy price
        user.balance.coin += sellPrice;
        inventoryItem.quantity -= 1;

        if (inventoryItem.quantity === 0) {
            user.inventory = user.inventory.filter(i => i.item !== item.name);
        }

        await user.save();
        ctx.sendMessage(`You have successfully sold ${item.name} for ${sellPrice} coins.`);
    }
};

const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/User.js');
const ShopItem = require('../../schemas/ShopItem.js');

module.exports = class Buy extends Command {
    constructor(client) {
        super(client, {
            name: 'buy',
            description: {
                content: 'Buy items from the shop.',
                examples: ['buy <itemName>'],
                usage: 'buy <itemName>',
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
        const item = await ShopItem.findOne({ name: itemName, available: true });

        if (!item) {
            return ctx.sendMessage('Item not found or not available.');
        }

        if (user.balance.coin < item.price) {
            return ctx.sendMessage('You don’t have enough coins to buy this item.');
        }

        user.balance.coin -= item.price;

        const existingItem = user.inventory.find(i => i.item === item.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.inventory.push({ item: item.name, quantity: 1 });
        }

        await user.save();
        ctx.sendMessage(`You have successfully purchased ${item.name} ${item.emoji}.`);
    }
};

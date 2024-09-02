const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const ShopItem = require('../../schemas/shopItem');

module.exports = class Buy extends Command {
    constructor(client) {
        super(client, {
            name: 'buy',
            description: {
                content: 'Buy items from the shop using item ID.',
                examples: ['buy <itemId>'],
                usage: 'buy <itemId>',
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
        const itemId = args[0];
        const user = await Users.findOne({ userId: ctx.author.id });
        const item = await ShopItem.findById({ id: itemId });

        if (!item || !item.available) {
            return ctx.sendMessage('Item not found or not available.');
        }

        if (user.balance.coin < item.price) {
            return ctx.sendMessage('You don’t have enough coins to buy this item.');
        }

        user.balance.coin -= item.price;

        // Check if the item is already in the user's inventory
        const existingItem = user.inventory.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.inventory.push({
                id: itemId,
                name: item.name,
                quantity: 1
            });
        }

        await user.save();

        const embed = client.embed()
            .setTitle('Purchase Successful')
            .setColor(client.color.main)
            .setDescription(`You have successfully purchased ${item.name} ${item.emoji}.`)
            .addFields([
                { name: 'Item ID', value: itemId, inline: false},
                { name: 'Item Price', value: `${item.price} ${client.emoji.coin}`, inline: false},
                { name: 'Your Remaining Balance', value: `${user.balance.coin} ${client.emoji.coin}`, inline: false},
            ])
            .setFooter({ text: 'Thank you for shopping!' });

        return ctx.sendMessage({ embeds: [embed] });
    }
};

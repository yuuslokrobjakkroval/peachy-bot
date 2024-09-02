const { Command } = require('../../structures');
const Users = require('../../schemas/user');
const ShopItem = require('../../schemas/shopItem');

module.exports = class Sell extends Command {
    constructor(client) {
        super(client, {
            name: 'sell',
            description: {
                content: 'Sell items from your inventory using item ID.',
                examples: ['sell <itemId>'],
                usage: 'sell <itemId>',
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
        const itemId = args[0]; // Get item ID from arguments
        const user = await Users.findOne({ userId: ctx.author.id });
        const item = await ShopItem.findById({ id: itemId });

        if (!item || !item.available) {
            return ctx.sendMessage('Item not found or not available for sale.');
        }

        const inventoryItem = user.inventory.find(i => i.id === itemId);
        if (!inventoryItem) {
            return ctx.sendMessage('You do not own this item.');
        }
        const saleValue = item.price * 0.5;

        user.balance.coin += saleValue;
        inventoryItem.quantity -= 1;

        if (inventoryItem.quantity <= 0) {
            user.inventory = user.inventory.filter(i => i.id !== itemId);
        }

        await user.save();

        const embed = client.embed()
            .setTitle('Sale Successful')
            .setColor(client.color.main)
            .setDescription(`You have successfully sold ${item.name} ${item.emoji}.`)
            .addFields([
                { name: 'Item ID', value: itemId, inline: false},
                { name: 'Sale Value', value: `${saleValue} ${client.emoji.coin}`, inline: false},
                { name: 'Your New Balance', value: `${user.balance.coin} ${client.emoji.coin}`, inline: false},
            ])
            .setFooter({ text: 'Thank you for selling!' });

        return ctx.sendMessage({ embeds: [embed] });
    }
};

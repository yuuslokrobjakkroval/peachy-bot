const { Command } = require('../../structures/index.js');
const ShopItem = require('../../schemas/ShopItem');

module.exports = class Shop extends Command {
    constructor(client) {
        super(client, {
            name: 'shop',
            description: {
                content: 'View available items in the shop.',
                examples: ['shop'],
                usage: 'shop',
            },
            category: 'inventory',
            aliases: ['store'],
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx) {
        const items = await ShopItem.find({ available: true });
        if (!items.length) {
            return ctx.sendMessage({ content: 'The shop is currently empty!' });
        }

        const itemList = items.map(item => `${item.emoji} **${item.name}** - ${item.price.buy} coins`).join('\n');

        return ctx.sendMessage({
            embeds: [client.embed().setTitle('Shop Items').setDescription(itemList).setColor(client.color.main)],
        });
    }
};

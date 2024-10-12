const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const ShopItems = require('../../assets/inventory/ShopItems.js')
const ImportantItems = require('../../assets/inventory/ImportantItems.js')
const MoreItems = ShopItems.flatMap(shop => shop.inventory);
const AllItems = [...ImportantItems, ...MoreItems];

module.exports = class AddItem extends Command {
    constructor(client) {
        super(client, {
            name: 'additem',
            description: {
                content: '',
                examples: ['additem pickaxe 2'],
                usage: 'additem <item> <quantity>',
            },
            category: 'dev',
            aliases: ['ai'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'user',
                    description: 'The Discord user ID of the user.',
                    type: 3, // String type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const user = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author // Default to the author if no user is provided
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;
        if (user.bot) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'mention_to_bot'), color);
        let userData = await Users.findOne({ userId: user.id });
        if (!userData) {
            userData = new Users({
                userId: user.id,
                balance: {
                    coin: 0,
                    bank: 0,
                },
                inventory: [],
            });
            await userData.save();
        }

        const itemId = args[1]?.toLowerCase();
        const itemInfo = AllItems.find(({ id }) => id === itemId);

        if (!itemInfo) {
            return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'invalid_item'), color);
        }

        let quantity = args[2] || 1;
        if (isNaN(quantity) || quantity <= 0 || quantity.toString().includes('.') || quantity.toString().includes(',')) {
            return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'invalid_quantity'), color);
        }

        const baseQuantity = parseInt(quantity);

        const itemIndex = userData.inventory.findIndex(i => i.id === itemId);

        if (itemIndex !== -1) {
            await Users.updateOne(
                { userId: user.id, "inventory.id": itemId },
                { $inc: { "inventory.$.quantity": baseQuantity } }
            ).exec();
        } else {
            await Users.updateOne(
                { userId: user.id },
                { $push: { inventory: { id: itemId, name: itemInfo.name, quantity: baseQuantity } } }
            ).exec();
        }

        const embed = client
            .embed()
            .setColor(color.main)
            .setDescription(`${emoji.tick} Added ${itemInfo.emoji} **\`x${baseQuantity}\`** ${itemInfo.id} to ${user}.`);

        return await ctx.sendMessage({ embeds: [embed] });
    }
};
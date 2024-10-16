const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Themes = inventory.filter(value => value.type === 'theme').sort((a, b) => a.price.buy - b.price.buy);

module.exports = class Use extends Command {
    constructor(client) {
        super(client, {
            name: 'use',
            description: {
                content: 'Use a theme item to customize your embed color and emoji.',
                examples: ['use t01'],
                usage: 'use <item_id>',
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
            slashCommand: false,
            options: [
                {
                    name: 'items',
                    description: 'The theme you want to use.',
                    type: 3,
                    required: false,
                }
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const themeMessages = language.locales.get(language.defaultLocale)?.utilityMessages?.themeMessages; // Access messages
        const user = await Users.findOne({ userId: ctx.author.id });
        const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString().toLowerCase() : args[0].toLowerCase();
        const themeItem = Themes.concat(ImportantItems).find((item) => item.id === itemId);

        if (!themeItem) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                themeMessages?.themeID.replace('%{itemId}', itemId), // Using themeMessages for invalid theme ID
                color
            );
        }

        const existingItem = user.inventory.find(invItem => invItem.id === itemId);

        if (!existingItem) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                themeMessages?.notOwned.replace('%{itemName}', themeItem.name), // Using themeMessages for not owned theme
                color
            );
        }

        if (!themeItem.able.use) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                themeMessages?.unavailable.replace('%{itemName}', themeItem.name), // Using themeMessages for unavailable theme
                color
            );
        }

        await Users.updateOne(
            { userId: ctx.author.id },
            { $set: { 'preferences.theme': themeItem.id } }
        ).exec();

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                themeMessages?.applied
                    .replace('%{itemEmote}', themeItem.emoji)
                    .replace('%{itemName}', themeItem.name) // Using themeMessages for applied theme
            );

        return await ctx.sendMessage({ embeds: [embed] });
    }
};

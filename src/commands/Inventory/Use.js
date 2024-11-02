const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Themes = inventory.filter(value => value.type === 'theme' || value.type === 'special theme').sort((a, b) => a.price.buy - b.price.buy);
const Wallpapers = inventory.filter(value => value.type === 'wallpaper'); // Assuming wallpapers are defined similarly

module.exports = class Use extends Command {
    constructor(client) {
        super(client, {
            name: 'use',
            description: {
                content: 'Use a theme or wallpaper item to customize your embed color, emoji, or background.',
                examples: ['use t01', 'use w01'],
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
                    description: 'The theme or wallpaper you want to use.',
                    type: 3,
                    required: false,
                }
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const useMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.useMessages;
        const userId = ctx.author.id;

        try {
            const user = await client.utils.getUser(userId);
            const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString().toLowerCase() : args[0].toLowerCase();
            const themeItem = Themes.concat(ImportantItems).find((item) => item.id === itemId);
            const wallpaperItem = Wallpapers.concat(ImportantItems).find((item) => item.id === itemId);

            if (themeItem) {
                if (!themeItem.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemName}', themeItem.name),
                        color
                    );
                }

                const currentTheme = user.preferences?.theme;

                if (currentTheme === themeItem.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemName}', themeItem.name),
                        color
                    );
                }

                await Users.updateOne(
                    { userId },
                    { $set: { 'preferences.theme': themeItem.id } }
                );

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{itemEmote}', themeItem.emoji)
                            .replace('%{itemName}', themeItem.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            }

            if (wallpaperItem) {
                if (!wallpaperItem.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemName}', wallpaperItem.name),
                        color
                    );
                }

                const equippedWallpaper = user.equip.find(equippedItem => equippedItem.id.startsWith('w'));

                if (equippedWallpaper && equippedWallpaper.id === wallpaperItem.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemName}', wallpaperItem.name).replace('%{itemEmote}', wallpaperItem.emoji),
                        color
                    );
                }

                const inventoryItemIndex = user.inventory.findIndex(invItem => invItem.id === itemId);

                if (equippedWallpaper) {
                    await Users.updateOne(
                        { userId },
                        { $pull: { equip: { id: equippedWallpaper.id } } }
                    );

                    const existingInventoryItem = user.inventory.find(item => item.id === equippedWallpaper.id);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += equippedWallpaper.quantity;
                    } else {
                        user.inventory.push({
                            id: equippedWallpaper.id,
                            name: equippedWallpaper.name,
                            quantity: equippedWallpaper.quantity
                        });
                    }
                }

                if (inventoryItemIndex > -1) {
                    if (user.inventory[inventoryItemIndex].quantity > 1) {
                        user.inventory[inventoryItemIndex].quantity -= 1;
                    } else {
                        user.inventory.splice(inventoryItemIndex, 1);
                    }
                }

                await Users.updateOne(
                    { userId },
                    {
                        $addToSet: { equip: { id: wallpaperItem.id, name: wallpaperItem.name, quantity: 1 } },
                        $set: { inventory: user.inventory }
                    }
                );

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{itemEmote}', wallpaperItem.emoji)
                            .replace('%{itemName}', wallpaperItem.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            }

            return await client.utils.sendErrorMessage(
                client,
                ctx,
                useMessages?.themeID.replace('%{itemId}', itemId),
                color
            );

        } catch (error) {
            console.error("Error in the 'use' command:", error);
            return await client.utils.sendErrorMessage(client, ctx, "An error occurred while processing your request.", color);
        }
    }
};

const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Themes = inventory.filter(value => value.type === 'theme' || value.type === 'special theme').sort((a, b) => a.price.buy - b.price.buy);
const Wallpapers = inventory.filter(value => value.type === 'wallpaper');
const Colors = inventory.filter(value => value.type === 'color');

module.exports = class Use extends Command {
    constructor(client) {
        super(client, {
            name: 'use',
            description: {
                content: '𝑼𝒔𝒆 𝒂 𝒕𝒉𝒆𝒎𝒆, 𝒘𝒂𝒍𝒍𝒑𝒂𝒑𝒆𝒓, 𝒐𝒓 𝒄𝒐𝒍𝒐𝒓 𝒊𝒕𝒆𝒎 𝒕𝒐 𝒄𝒖𝒔𝒕𝒐𝒎𝒊𝒛𝒆 𝒚𝒐𝒖𝒓 𝒑𝒓𝒐𝒇𝒊𝒍𝒆.',
                examples: ['use t01', 'use w01'],
                usage: 'use <itemId>',
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
                    description: 'The theme, wallpaper, or color you want to use.',
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
            const themeItem = Themes.concat(ImportantItems).find(item => item.id === itemId);
            const wallpaperItem = Wallpapers.concat(ImportantItems).find(item => item.id === itemId);
            const colorItem = Colors.concat(ImportantItems).find(item => item.id === itemId);
            const inventoryItem = user.inventory.find(item => item.id === itemId);

            if (!inventoryItem) {
                return await client.utils.sendErrorMessage(
                    client,
                    ctx,
                    useMessages?.notInInventory.replace('%{itemId}', itemId),
                    color
                );
            }

            if (themeItem) {
                if (!themeItem.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemEmote}', themeItem.emoji).replace('%{itemName}', themeItem.name),
                        color
                    );
                }

                const currentTheme = user.preferences?.theme;
                if (currentTheme === themeItem.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', themeItem.emoji).replace('%{itemName}', themeItem.name),
                        color
                    );
                }

                if (currentTheme) {
                    await Users.updateOne(
                        { userId },
                        { $set: { 'preferences.theme': null } }
                    );

                    const existingInventoryItem = user.inventory.find(item => item.id === currentTheme);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: currentTheme,
                            quantity: 1
                        });
                    }
                }

                const inventoryItemIndex = user.inventory.findIndex(invItem => invItem.id === itemId);

                if (inventoryItemIndex > -1) {
                    if (user.inventory[inventoryItemIndex].quantity > 1) {
                        user.inventory[inventoryItemIndex].quantity -= 1;
                    } else {
                        user.inventory.splice(inventoryItemIndex, 1);
                    }
                }

                const equippedTheme = user.equip.find(equippedItem => equippedItem.id.startsWith('t') || equippedItem.id.startsWith('st'));

                if (equippedTheme) {
                    await Users.updateOne(
                        { userId },
                        { $pull: { equip: { id: equippedTheme.id } } }
                    );
                }

                await Users.updateOne(
                    { userId },
                    {
                        $addToSet: { equip: { id: themeItem.id, quantity: 1 } },
                        $set: {
                            'preferences.theme': themeItem.id,
                            inventory: user.inventory
                        }
                    }
                );

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', '𝒕𝒉𝒆𝒎𝒆')
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
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', wallpaperItem.emoji).replace('%{itemName}', wallpaperItem.name),
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
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: equippedWallpaper.id,
                            quantity: 1
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
                        $addToSet: { equip: { id: wallpaperItem.id, quantity: 1 } },
                        $set: { inventory: user.inventory }
                    }
                );

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', '𝒘𝒂𝒍𝒍𝒑𝒂𝒑𝒆𝒓')
                            .replace('%{itemEmote}', wallpaperItem.emoji)
                            .replace('%{itemName}', wallpaperItem.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            }

            if (colorItem) {
                if (!colorItem.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemName}', colorItem.name),
                        color
                    );
                }

                const equippedColor = user.equip.find(equippedItem => equippedItem.id.startsWith('p'));

                if (equippedColor && equippedColor.id === colorItem.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', colorItem.emoji).replace('%{itemName}', colorItem.name),
                        color
                    );
                }

                const inventoryItemIndex = user.inventory.findIndex(invItem => invItem.id === itemId);

                if (equippedColor) {
                    await Users.updateOne(
                        { userId },
                        { $pull: { equip: { id: equippedColor.id } } }
                    );

                    const existingInventoryItem = user.inventory.find(item => item.id === equippedColor.id);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: equippedColor.id,
                            quantity: 1
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
                        $addToSet: { equip: { id: colorItem.id, quantity: 1 } },
                        $set: { inventory: user.inventory }
                    }
                );

                const embed = client.embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', '𝒄𝒐𝒍𝒐𝒓')
                            .replace('%{itemEmote}', colorItem.emoji)
                            .replace('%{itemName}', colorItem.name)
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

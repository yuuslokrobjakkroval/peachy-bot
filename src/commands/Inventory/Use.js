const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems');
const { openLootbox } = require('../../assets/inventory/Base/Lootboxes.js');
const Inventory = ShopItems.flatMap((shop) => shop.inventory);
const Themes = Inventory.filter((value) => value.type === 'theme' || value.type === 'special theme').sort(
    (a, b) => a.price.buy - b.price.buy
);

const Lootboxes = Inventory.filter((value) => value.type === 'box');
const Decoration = Inventory.filter((value) => value.type === 'decoration');
const Wallpapers = Inventory.filter((value) => value.type === 'wallpaper');
const Colors = Inventory.filter((value) => value.type === 'color');
const Tools = Inventory.filter((value) => value.type === 'tool');

module.exports = class Use extends Command {
    constructor(client) {
        super(client, {
            name: 'use',
            description: {
                content: 'Use a theme, wallpaper, or color item to customize your profile.',
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
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const useMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.useMessages;
        const userId = ctx.author.id;

        try {
            const user = await client.utils.getUser(userId);
            const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString().toLowerCase() : args[0].toLowerCase();
            const itemInfo = ImportantItems.concat(
                Colors,
                Decoration,
                Themes,
                Tools,
                Wallpapers,
                Lootboxes,
                Inventory.filter((value) => value.type === 'potion')
            ).find((item) => item.id === itemId);
            const inventoryItem = user.inventory.find((item) => item.id === itemId);
            if (!inventoryItem) {
                return await client.utils.sendErrorMessage(client, ctx, useMessages?.notInInventory.replace('%{itemId}', itemId), color);
            }

            if (['special theme', 'theme'].includes(itemInfo.type)) {
                if (!itemInfo.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const currentTheme = user.preferences?.theme;
                if (currentTheme === itemInfo.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                if (currentTheme) {
                    await Users.updateOne({ userId }, { $set: { 'preferences.theme': null } });
                    const existingInventoryItem = user.inventory.find((item) => item.id === currentTheme);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: currentTheme,
                            quantity: 1,
                        });
                    }
                }

                const inventoryItemIndex = user.inventory.findIndex((invItem) => invItem.id === itemId);
                if (inventoryItemIndex > -1) {
                    if (user.inventory[inventoryItemIndex].quantity > 1) {
                        user.inventory[inventoryItemIndex].quantity -= 1;
                    } else {
                        user.inventory.splice(inventoryItemIndex, 1);
                    }
                }

                const equippedTheme = user.equip.find(
                    (equippedItem) => equippedItem.id.startsWith('t') || equippedItem.id.startsWith('st')
                );
                if (equippedTheme) {
                    await Users.updateOne({ userId }, { $pull: { equip: { id: equippedTheme.id } } });
                }

                await Users.updateOne(
                    { userId },
                    {
                        $addToSet: { equip: { id: itemInfo.id, quantity: 1 } },
                        $set: {
                            'preferences.theme': itemInfo.id,
                            inventory: user.inventory,
                        },
                    }
                );

                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', 'theme')
                            .replace('%{itemEmote}', itemInfo.emoji)
                            .replace('%{itemName}', itemInfo.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            } else if (itemInfo.type === 'decoration') {
                if (!itemInfo.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const equippedDecoration = user.equip.find((equippedItem) => equippedItem.id.startsWith('d'));
                if (equippedDecoration && equippedDecoration.id === itemInfo.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const inventoryItemIndex = user.inventory.findIndex((invItem) => invItem.id === itemId);
                if (equippedDecoration) {
                    await Users.updateOne({ userId }, { $pull: { equip: { id: equippedDecoration.id } } });

                    const existingInventoryItem = user.inventory.find((item) => item.id === equippedDecoration.id);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: equippedDecoration.id,
                            quantity: 1,
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
                        $addToSet: { equip: { id: itemInfo.id, quantity: 1 } },
                        $set: { inventory: user.inventory },
                    }
                );

                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', 'decoration')
                            .replace('%{itemEmote}', itemInfo.emoji)
                            .replace('%{itemName}', itemInfo.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            } else if (itemInfo.type === 'wallpaper') {
                if (!itemInfo.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const equippedWallpaper = user.equip.find((equippedItem) => equippedItem.id.startsWith('w'));
                if (equippedWallpaper && equippedWallpaper.id === itemInfo.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const inventoryItemIndex = user.inventory.findIndex((invItem) => invItem.id === itemId);
                if (equippedWallpaper) {
                    await Users.updateOne({ userId }, { $pull: { equip: { id: equippedWallpaper.id } } });

                    const existingInventoryItem = user.inventory.find((item) => item.id === equippedWallpaper.id);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: equippedWallpaper.id,
                            quantity: 1,
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
                        $addToSet: { equip: { id: itemInfo.id, quantity: 1 } },
                        $set: { inventory: user.inventory },
                    }
                );

                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', 'wallpaper')
                            .replace('%{itemEmote}', itemInfo.emoji)
                            .replace('%{itemName}', itemInfo.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            } else if (itemInfo.type === 'color') {
                if (!itemInfo.able.use) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.unavailable.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const equippedColor = user.equip.find((equippedItem) => equippedItem.id.startsWith('p'));
                if (equippedColor && equippedColor.id === itemInfo.id) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        useMessages?.alreadyEquipped.replace('%{itemEmote}', itemInfo.emoji).replace('%{itemName}', itemInfo.name),
                        color
                    );
                }

                const inventoryItemIndex = user.inventory.findIndex((invItem) => invItem.id === itemId);
                if (equippedColor) {
                    await Users.updateOne({ userId }, { $pull: { equip: { id: equippedColor.id } } });

                    const existingInventoryItem = user.inventory.find((item) => item.id === equippedColor.id);
                    if (existingInventoryItem) {
                        existingInventoryItem.quantity += 1;
                    } else {
                        user.inventory.push({
                            id: equippedColor.id,
                            quantity: 1,
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
                        $addToSet: { equip: { id: itemInfo.id, quantity: 1 } },
                        $set: { inventory: user.inventory },
                    }
                );

                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        useMessages?.applied
                            .replace('%{type}', 'color')
                            .replace('%{itemEmote}', itemInfo.emoji)
                            .replace('%{itemName}', itemInfo.name)
                    );

                return await ctx.sendMessage({ embeds: [embed] });
            } else if (itemInfo.type === 'tool') {
                const hasTools = user.equip.find((eq) => eq.id.toLowerCase() === itemId);
                if (hasTools) {
                    const embed = client
                        .embed()
                        .setColor(client.color.main)
                        .setDescription(`You already have ${itemInfo.emoji} **${itemInfo.name}** equipped. Do you want to change?`);

                    const yesButton = client.utils.labelButton('accept', 'Yes', 3);
                    const noButton = client.utils.labelButton('cancel', 'No', 4);
                    const row = client.utils.createButtonRow(yesButton, noButton);

                    const message = {
                        embeds: [embed],
                        components: [row],
                        fetchReply: true,
                    };

                    const msg = ctx.isInteraction ? await ctx.interaction.reply(message) : await ctx.channel.send(message);

                    const filter = (i) => i.user.id === ctx.author.id;
                    const collector = msg.createMessageComponentCollector({ filter });

                    collector.on('collect', async (int) => {
                        await int.deferUpdate();
                        if (int.customId === 'accept') {
                            const embed = client
                                .embed()
                                .setColor(client.color.main)
                                .setDescription(`You have successfully changed to ${itemInfo.emoji} **${itemInfo.name}**.`);

                            try {
                                await Users.updateOne(
                                    { userId: ctx.author.id, 'inventory.id': itemInfo.id },
                                    {
                                        $pull: { equip: { id: itemInfo.id } },
                                        $inc: { 'inventory.$.quantity': -1 },
                                    }
                                );

                                await Users.updateOne(
                                    { userId: ctx.author.id },
                                    {
                                        $push: {
                                            equip: { id: itemInfo.id, quantity: itemInfo.quantity },
                                        },
                                    }
                                );

                                await Users.updateOne(
                                    { userId: ctx.author.id, 'inventory.quantity': 0 },
                                    { $pull: { inventory: { quantity: 0 } } }
                                );

                                int.editReply({ embeds: [embed], components: [] });
                            } catch (error) {
                                console.error('Error updating user:', error);
                                int.editReply({
                                    embeds: [
                                        client
                                            .embed()
                                            .setColor(client.color.red)
                                            .setDescription('Failed to update your equipment. Please try again.'),
                                    ],
                                    components: [],
                                });
                            }
                        } else if (int.customId === 'cancel') {
                            await Promise.all([
                                ctx.message.delete().catch((err) => {
                                    if (err.code !== 10008) throw err;
                                }),
                                msg.delete().catch((err) => {
                                    if (err.code !== 10008) throw err;
                                }),
                            ]);
                        }
                    });

                    collector.on('end', async () => {
                        if (!msg) return;
                        await Promise.all([
                            ctx.message.delete().catch((err) => {
                                if (err.code !== 10008) throw err;
                            }),
                            msg.delete().catch((err) => {
                                if (err.code !== 10008) throw err;
                            }),
                        ]);
                    });
                } else {
                    const hasItems = user.inventory.find((inv) => inv.id.toLowerCase() === itemId);
                    if (!hasItems || hasItems.quantity <= 0) {
                        return await client.utils.sendErrorMessage(
                            client,
                            ctx,
                            `You don't have ${itemInfo.emoji} **${itemInfo.name}** in your inventory.`,
                            color
                        );
                    } else {
                        const embed = client
                            .embed()
                            .setColor(client.color.main)
                            .setDescription(`You have successfully used ${itemInfo.emoji} **${itemInfo.name}**.`);
                        await Promise.all([
                            Users.updateOne(
                                { userId: ctx.author.id },
                                {
                                    $push: {
                                        equip: {
                                            id: itemInfo.id,
                                            quantity: itemInfo.quantity,
                                        },
                                    },
                                }
                            ),

                            Users.updateOne(
                                {
                                    userId: ctx.author.id,
                                    'inventory.id': itemInfo.id,
                                },
                                { $inc: { 'inventory.$.quantity': -1 } }
                            ),

                            Users.updateOne({ userId: ctx.author.id, 'inventory.quantity': 0 }, { $pull: { inventory: { quantity: 0 } } }),
                        ]);
                        return ctx.sendMessage({ embeds: [embed] });
                    }
                }
            } else if (itemInfo.type === 'box') {
                // Lootbox opening handler
                const inventoryItem = user.inventory.find((inv) => inv.id === itemId);

                if (!inventoryItem || inventoryItem.quantity <= 0) {
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        `You don't have ${itemInfo.emoji} **${itemInfo.name}** in your inventory.`,
                        color
                    );
                }

                try {
                    // Open the lootbox and get random rewards
                    const rewards = openLootbox(itemId);

                    if (!rewards || rewards.length === 0) {
                        return await client.utils.sendErrorMessage(client, ctx, 'Failed to open the lootbox. Please try again.', color);
                    }

                    // Add rewards to user inventory
                    for (const reward of rewards) {
                        const existingItem = user.inventory.find((inv) => inv.id === reward.id);
                        if (existingItem) {
                            existingItem.quantity += reward.quantity;
                        } else {
                            user.inventory.push({
                                id: reward.id,
                                quantity: reward.quantity,
                            });
                        }
                    }

                    // Remove lootbox from inventory
                    const boxIndex = user.inventory.findIndex((inv) => inv.id === itemId);
                    if (boxIndex > -1) {
                        if (user.inventory[boxIndex].quantity > 1) {
                            user.inventory[boxIndex].quantity -= 1;
                        } else {
                            user.inventory.splice(boxIndex, 1);
                        }
                    }

                    // Update database
                    await Users.updateOne({ userId }, { $set: { inventory: user.inventory } });

                    // Build rewards description
                    const rewardLines = rewards
                        .map((reward) => {
                            const rewardItem = Inventory.find((item) => item.id === reward.id);
                            return `\`${rewardItem?.id}\` ${rewardItem?.emoji || '📦'} **${rewardItem?.name || reward.id}** × ${reward.quantity}`;
                        })
                        .join('\n');

                    // Send success message with rewards
                    const embed = client
                        .embed()
                        .setColor(color.main)
                        .setTitle(`${itemInfo.emoji} ${itemInfo.name} Opened!`)
                        .setDescription(`You received the following items:\n\n${rewardLines}`)
                        .setFooter({ text: `Thank you for opening the ${itemInfo.name}!` });

                    return await ctx.sendMessage({ embeds: [embed] });
                } catch (error) {
                    console.error('Error opening lootbox:', error);
                    return await client.utils.sendErrorMessage(
                        client,
                        ctx,
                        'An error occurred while opening the lootbox. Please try again.',
                        color
                    );
                }
            } else {
                return await client.utils.sendErrorMessage(client, ctx, useMessages?.invalidItem.replace('%{itemId}', itemId), color);
            }
        } catch (error) {
            console.error("Error in the 'use' command:", error);
            return await client.utils.sendErrorMessage(client, ctx, 'An error occurred while processing your request.', color);
        }
    }
};

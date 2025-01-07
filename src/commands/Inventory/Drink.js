const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const AllItems = ShopItems.flatMap(shop => shop.inventory);

module.exports = class Drink extends Command {
    constructor(client) {
        super(client, {
            name: 'drink',
            description: {
                content: '𝑫𝒓𝒊𝒏𝒌 𝒂𝒏 𝒊𝒕𝒆𝒎 𝒕𝒐 𝒈𝒂𝒊𝒏 𝑿𝑷.',
                examples: ['drink tembo 1'],
                usage: 'drink <item> <amount>',
            },
            category: 'inventory',
            aliases: ['d', 'pherk'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'item',
                    description: 'The drink item you want to drink.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount you want to drink.',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const drinkMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.drinkMessages;
        const authorId = ctx.author.id;

        client.utils.getUser(authorId).then(user => {
            if (!user || user.inventory.length === 0) {
                return client.utils.sendErrorMessage(client, ctx, drinkMessages.emptyInventory, color);
            }

            const itemId = ctx.isInteraction ? ctx.interaction.options.data[0]?.value.toString() : args[0];
            const itemInfo = AllItems.find(({ id }) => id.toLowerCase() === itemId.toLowerCase());

            if (!itemInfo) {
                return client.utils.sendErrorMessage(client, ctx, drinkMessages.itemNotFound.replace('%{itemId}', itemId), color);
            }

            if (itemInfo.type === 'food') {
                return client.utils.sendErrorMessage(client, ctx, drinkMessages.cannotDrinkFood
                    .replace('%{itemEmote}', itemInfo.emoji)
                    .replace('%{itemName}', itemInfo.name), color);
            }

            if (itemInfo.type !== 'drink') {
                return client.utils.sendErrorMessage(client, ctx, drinkMessages.notDrinkable, color);
            }

            const hasItems = user.inventory.find(item => item.id === itemId);

            if (!itemInfo || !hasItems) {
                return client.utils.sendErrorMessage(client, ctx, drinkMessages.noDrinkItem, color);
            }

            let amount = ctx.isInteraction ? ctx.interaction.options.data[1]?.value || 1 : args[1] || 1;
            if (isNaN(amount) || amount <= 0 || amount.toString().includes('.')) {
                return client.utils.sendErrorMessage(client, ctx, drinkMessages.invalidAmount, color);
            }

            const itemAmount = parseInt(Math.min(amount, hasItems.quantity));
            const xpGained = itemInfo.xp * itemAmount;

            // Update user inventory and XP
            hasItems.quantity -= itemAmount;
            user.profile.xp = (user.profile.xp || 0) + xpGained;

            // Track consumed items
            const consumedItem = user.consumedItems.find(item => item.id === itemId);
            if (consumedItem) {
                consumedItem.quantity += itemAmount;
            } else {
                user.consumedItems.push({ id: itemId, name: itemInfo.name, type: itemInfo.type, quantity: itemAmount });
            }

            // Remove the item from inventory if quantity is zero
            if (hasItems.quantity <= 0) {
                user.inventory = user.inventory.filter(item => item.id !== itemId);
            }

            user.save().then(() => {
                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        drinkMessages.success
                            .replace('%{itemEmote}', itemInfo.emoji)
                            .replace('%{itemAmount}', itemAmount)
                            .replace('%{itemName}', itemInfo.name)
                            .replace('%{xpGained}', xpGained)
                    )
                    .setFooter({
                        text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                ctx.sendMessage({ embeds: [embed] });
            }).catch(err => {
                console.error('Error saving user data:', err);
                client.utils.sendErrorMessage(client, ctx, generalMessages.error, color);
            });
        }).catch(err => {
            console.error('Error fetching user data:', err);
            client.utils.sendErrorMessage(client, ctx, generalMessages.error, color);
        });
    }
};
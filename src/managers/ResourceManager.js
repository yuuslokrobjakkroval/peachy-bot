const ImportantItems = require('../assets/inventory/ImportantItems');
const moment = require('moment-timezone');
const ms = require('ms');
const Chance = require('chance').Chance();

class ResourceManager {
    constructor(client) {
        this.client = client;
    }

    async gatherResource(ctx, resourceType, toolList, resourceList, emoji, color, language) {
        const resourceMessages = language.locales.get(language.defaultLocale)?.buildingMessages?.resourceMessages;
        if (!Array.isArray(resourceList)) {
            console.error('ResourceManager.gatherResource: resourceList is not an array:', typeof resourceList, resourceList);
            return await this.client.utils.sendErrorMessage(
                this.client,
                ctx,
                'Internal error: Invalid resource list. Please contact an administrator.',
                color
            );
        }

        if (!Array.isArray(toolList)) {
            console.error('ResourceManager.gatherResource: toolList is not an array:', typeof toolList, toolList);
            return await this.client.utils.sendErrorMessage(
                this.client,
                ctx,
                'Internal error: Invalid tool list. Please contact an administrator.',
                color
            );
        }

        const author = ctx.author;
        const user = await this.client.utils.getCachedUser(author.id);
        if (!user) {
            return await this.client.utils.sendErrorMessage(
                this.client,
                ctx,
                'You need to register first! Use the `/register` command.',
                color
            );
        }

        // Get equipped tool
        let userTool = user.equip.find((equip) => toolList.some((tool) => tool.id === equip.id));
        if (!userTool) {
            userTool = { id: 'hand', quantity: 1 };
        }

        const equippedTool = toolList.find((tool) => tool.id === userTool.id) || ImportantItems.find((item) => item.id === 'hand');

        const [tool, maxQuantity, gatheredAmount, cooldown] =
            userTool.id === 'hand'
                ? [equippedTool, equippedTool.quantity, 1, '8s']
                : [equippedTool, equippedTool.quantity, Chance.integer({ min: 1, max: 5 }), '5s'];

        const cooldownDuration = ms(cooldown);
        const isCooldownExpired = await this.client.utils.checkCooldown(author.id, resourceType.toLowerCase(), cooldownDuration);
        if (!isCooldownExpired) {
            const cooldownMessage = resourceMessages.cooldown
                .replace('%{resourceType}', resourceType)
                .replace('%{time}', `<t:${Math.floor((Date.now() + cooldownDuration) / 1000)}:R>`);
            return await this.client.utils.sendErrorMessage(this.client, ctx, cooldownMessage, color);
        }

        // Generate resources
        const generatedItems = await this.generateItems(equippedTool, gatheredAmount, resourceList, resourceType);
        const aggregatedItems = this.aggregateItems(generatedItems);

        // Calculate total worth
        const totalWorth = aggregatedItems.reduce((total, item) => total + item.price.sell * item.quantity, 0);

        // Format items description
        const itemsDescription =
            aggregatedItems
                .map((item) => `${item.emoji} **+${item.quantity}** ${this.client.utils.formatCapitalize(item.name || item.id)}`)
                .join('\n') || `No ${resourceType.toLowerCase()}s found!`;

        // Update user inventory and tool durability
        let currentQuantity = maxQuantity;
        await this.client.utils.updateUserWithRetry(author.id, async (user) => {
            // Add items to inventory
            aggregatedItems.forEach((item) => {
                const existingItem = user.inventory.find((inv) => inv.id === item.id);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    user.inventory.push({ id: item.id, quantity: item.quantity });
                }
            });

            // Update tool durability
            if (userTool.id !== 'hand') {
                const equipItem = user.equip.find((equip) => equip.id === userTool.id);
                if (equipItem) {
                    equipItem.quantity -= 1;
                    currentQuantity = equipItem.quantity;
                    if (equipItem.quantity <= 0) {
                        user.equip = user.equip.filter((equip) => equip.id !== userTool.id);
                        currentQuantity = 0;
                    }
                }
            }

            await this.client.utils.updateCooldown(author.id, resourceType.toLowerCase(), cooldownDuration);
        });

        // Create and send embed
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const embed = this.client
            .embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', resourceType.toUpperCase())
                    .replace('%{mainRight}', emoji.mainRight)
            )
            .addFields(
                {
                    name: 'Resources Found',
                    value: itemsDescription,
                    inline: false,
                },
                {
                    name: 'Tool Durability',
                    value: `${tool.emoji} **\`${currentQuantity}/${maxQuantity}\`**`,
                    inline: true,
                },
                {
                    name: 'Total Worth',
                    value: `**${this.client.utils.formatNumber(totalWorth)}** ${emoji.coin}`,
                    inline: true,
                }
            )
            .setFooter({
                text:
                    generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return await ctx.sendMessage({ embeds: [embed] });
    }

    // Helper methods for resource generation
    async generateItems(tool, quantity, resourceList, resourceType) {
        const toolProbabilities = {
            hand: {
                amount: 1,
                common: 0.58,
                uncommon: 0.3,
                rare: 0.08,
                legendary: 0.03,
            },
            // Add specific tool probabilities based on resource type

            axe: {
                amount: Chance.integer({ min: 1, max: 2 }),
                common: 0.51,
                uncommon: 0.32,
                rare: 0.11,
                legendary: 0.04,
            },
            sxe: {
                amount: Chance.integer({ min: 1, max: 2 }),
                common: 0.51,
                uncommon: 0.32,
                rare: 0.11,
                legendary: 0.04,
            },
            net: {
                amount: Chance.integer({ min: 1, max: 2 }),
                common: 0.51,
                uncommon: 0.32,
                rare: 0.11,
                legendary: 0.04,
            },
            pole: {
                amount: Chance.integer({ min: 1, max: 2 }),
                common: 0.51,
                uncommon: 0.32,
                rare: 0.11,
                legendary: 0.04,
            },
            sword: {
                amount: Chance.integer({ min: 1, max: 2 }),
                common: 0.51,
                uncommon: 0.32,
                rare: 0.11,
                legendary: 0.04,
            },
        };

        const probabilities = toolProbabilities[tool?.id] || toolProbabilities.hand;
        const numItems = quantity * probabilities?.amount ?? 0;
        const generatedItems = [];

        for (let i = 0; i < numItems; i++) {
            const rarity = this.getRarity(probabilities);
            const item = this.generateRandomItem(rarity, resourceList);
            generatedItems.push(item);
        }

        return generatedItems;
    }

    getRarity(probabilities) {
        const rand = Math.random();

        if (rand < probabilities.common) return 'common';
        if (rand < probabilities.common + probabilities.uncommon) return 'uncommon';
        if (rand < probabilities.common + probabilities.uncommon + probabilities.rare) return 'rare';
        return 'legendary';
    }

    generateRandomItem(rarity, resourceList) {
        // Add defensive check to ensure resourceList is an array
        if (!Array.isArray(resourceList)) {
            console.error('ResourceManager.generateRandomItem: resourceList is not an array:', typeof resourceList, resourceList);
            return null;
        }

        const items = resourceList.filter((item) => item.rarity === rarity);
        if (items.length === 0) return null;

        const item = items[Math.floor(Math.random() * items.length)];
        const quantity = rarity === 'legendary' ? 1 : Math.floor(Math.random() * 3) + 1;

        return {
            id: item.id,
            name: item.name,
            emoji: item.emoji,
            quantity,
            price: item.price,
        };
    }

    aggregateItems(items) {
        const itemMap = new Map();

        for (const item of items) {
            if (!item) continue;

            if (itemMap.has(item.id)) {
                itemMap.get(item.id).quantity += item.quantity;
            } else {
                itemMap.set(item.id, { ...item });
            }
        }

        return Array.from(itemMap.values());
    }
}

module.exports = ResourceManager;

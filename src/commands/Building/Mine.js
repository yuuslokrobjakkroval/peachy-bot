const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const Chance = require('chance').Chance();
const Items = require('../../assets/inventory/ImportantItems.js');
const MineTools = require('../../assets/inventory/MineTools');
const Minerals = require('../../assets/inventory/Minerals.js');

module.exports = class Mine extends Command {
    constructor(client) {
        super(client, {
            name: 'mine',
            description: {
                content: 'Go mining for resources!',
                examples: ['mine'],
                usage: 'mine',
            },
            category: 'building',
            aliases: ['m'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const author = ctx.author;
        const user = await Users.findOne({ userId: author.id }).exec();
        let userTool = user.equip.find(equip => MineTools.some(tool => tool.id === equip.id));
        if (!userTool) {
            userTool = { id: 'hand', quantity: 1 };
        }

        const equippedTool = MineTools.find(({ id }) => id === userTool.id) || Items.find(({ id }) => id === 'hand');
        const [tool, maxQuantity, minedAmount, cooldownTime] = userTool.id === 'hand'
            ? [equippedTool, equippedTool.quantity, 1, 12000]
            : [equippedTool, equippedTool.quantity, Chance.integer({ min: 1, max: 3 }), 8000];

        // Check cooldown
        const cooldown = user.cooldowns.find(c => c.name === this.name.toLowerCase());
        const isOnCooldown = cooldown ? (Date.now() - cooldown.timestamp < cooldownTime) : false;

        if (isOnCooldown) {
            const remainingTime = Math.ceil((cooldown.timestamp + cooldownTime - Date.now()) / 1000);
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                `You have already mined recently! Please wait <t:${Math.round(Date.now() / 1000) + remainingTime}:R>.`,
                color,
                remainingTime * 1000
            );
        }

        const generatedItems = await generateItems(equippedTool, minedAmount);
        const aggregatedItems = aggregateItems(generatedItems);

        const totalWorth = aggregatedItems.reduce((total, item) => total + item.price.sell * item.quantity, 0);

        const itemsDescription = aggregatedItems
            .map(item => `${item.emoji} **x${item.quantity}** ${client.utils.formatCapitalize(item.id)}`) // Changed + to x for clarity
            .join('\n');

        let currentQuantity = 12;
        await updateUserWithRetry(author.id, async (user) => {
            aggregatedItems.forEach(item => {
                const existingItem = user.inventory.find(inv => inv.id === item.id);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    user.inventory.push({ id: item.id, quantity: item.quantity });
                }
            });

            if (userTool.id !== 'hand') {
                const equipItem = user.equip.find(equip => equip.id === userTool.id);
                if (equipItem) {
                    equipItem.quantity -= 1;
                    currentQuantity = equipItem.quantity;
                    if (equipItem.quantity <= 0) {
                        user.equip = user.equip.filter(equip => equip.id !== userTool.id);
                        currentQuantity = 0
                    }
                }
            }

            const existingCooldown = user.cooldowns.find(c => c.name === 'mine');
            if (existingCooldown) {
                existingCooldown.timestamp = Date.now();
            } else {
                user.cooldowns.push({ name: 'mine', timestamp: Date.now(), duration: cooldownTime });
            }
        });

        const embed = client.embed()
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "MINING")
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
                    value: `${client.utils.formatNumber(totalWorth)} ${emoji.coin}`,
                    inline: true,
                }
            )
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });

        return await ctx.sendMessage({ embeds: [embed] });
    }
};

async function updateUserWithRetry(userId, updateFn, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const user = await Users.findOne({ userId: userId }).exec();
            if (user) {
                await updateFn(user);
                await user.save();
                return true;
            }
            return false;
        } catch (error) {
            if (error.name === 'VersionError') {
                retries++;
                if (retries === maxRetries) {
                    return false;
                }
            } else {
                return false;
            }
        }
    }
}


async function generateItems(tool, quantity) {
    const toolProbabilities = {
        hand: { amount: 1, common: 0.58, uncommon: 0.3, rare: 0.08, legendary: 0.03 },
        sxe: { amount: Chance.integer({ min: 1, max: 2 }), common: 0.51, uncommon: 0.32, rare: 0.11, legendary: 0.04 },
    };

    const probabilities = toolProbabilities[tool?.item] || toolProbabilities.bare_hand;
    const numItems = quantity * probabilities.amount;
    const generatedItems = [];

    for (let i = 0; i < numItems; i++) {
        const rarity = getRarity(probabilities);
        const item = generateRandomItem(rarity);
        generatedItems.push(item);
    }

    return generatedItems;
}

function getRarity(probabilities) {
    const rand = Math.random();

    if (rand < probabilities.common) return 'common';
    if (rand < probabilities.common + probabilities.uncommon) return 'uncommon';
    if (rand < probabilities.common + probabilities.uncommon + probabilities.rare) return 'rare';
    return 'legendary';
}

function generateRandomItem(rarity) {
    const items = Minerals.filter(item => item.rarity === rarity && (item.type === 'ore' || item.type === 'mineral'));
    const item = items[Math.floor(Math.random() * items.length)];
    const quantity = rarity === 'legendary' ? 1 : Math.floor(Math.random() * 3) + 1;

    return { id: item.id, emoji: item.emoji, quantity, price: item.price };
}

function aggregateItems(items) {
    const itemMap = new Map();

    for (const item of items) {
        if (itemMap.has(item.id)) {
            itemMap.get(item.id).quantity += item.quantity;
        } else {
            itemMap.set(item.id, { ...item });
        }
    }

    return Array.from(itemMap.values());
}

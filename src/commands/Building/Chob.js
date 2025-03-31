const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const Chance = require('chance').Chance();
const Items = require('../../assets/inventory/ImportantItems.js');
const ChopTools = require('../../assets/inventory/ChopTools');
const Woods = require('../../assets/inventory/Woods.js');

module.exports = class Chop extends Command {
    constructor(client) {
        super(client, {
            name: 'chop',
            description: {
                content: 'Go chopping for wild Items!',
                examples: ['chop'],
                usage: 'chop',
            },
            category: 'building',
            aliases: ['c'],
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

        let user = await Users.findOne({userId: author.id}).exec();
        if (!user) {
            user = new Users({userId: author.id, username: author.username});
            await user.save();
        }

        let userTool = user.equip.find(equip => ChopTools.some(tool => tool.id === equip.id));
        if (!userTool) {
            userTool = {id: 'hand', quantity: 1};
        }

        const equippedTool = ChopTools.find(tool => tool.id === userTool.id) || Items.find(item => item.id === 'hand');

        const [tool, maxQuantity, minedAmount, cooldownTime] = userTool.id === 'hand'
            ? [equippedTool, equippedTool.quantity, 1, 8000]
            : [equippedTool, equippedTool.quantity, Chance.integer({min: 1, max: 5}), 15000];

        const cooldown = user.cooldowns.find(c => c.name === this.name.toLowerCase());
        const isOnCooldown = cooldown ? (Date.now() - cooldown.timestamp < cooldownTime) : false;

        if (isOnCooldown) {
            const remainingTime = Math.ceil((cooldown.timestamp + cooldownTime - Date.now()) / 1000);
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                `You have already chopped recently! Please wait <t:${Math.round(Date.now() / 1000) + remainingTime}:R>.`,
                color,
                remainingTime * 1000
            );
        }

        const generatedItems = await generateItems(equippedTool, minedAmount);
        const aggregatedItems = aggregateItems(generatedItems);

        const totalWorth = aggregatedItems.reduce((total, item) => total + item.price.sell * item.quantity, 0);

        const itemsDescription = aggregatedItems
            .map(item => `${item.emoji} **x${item.quantity}** ${client.utils.formatCapitalize(item.id)}`)
            .join('\n') || 'No woods found!';

        let currentQuantity= 12;
        await updateUserWithRetry(author.id, async (user) => {
            aggregatedItems.forEach(item => {
                const existingItem = user.inventory.find(inv => inv.id === item.id);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    user.inventory.push({ id: item.id, quantity: item.quantity});
                }
            });

            if (userTool.id !== 'hand') {
                const equipItem = user.equip.find(equip => equip.id === userTool.id);
                if (equipItem) {
                    equipItem.quantity -= 1;
                    currentQuantity = equipItem.quantity;
                    if (equipItem.quantity <= 0) {
                        user.equip = user.equip.filter(equip => equip.id !== userTool.id);
                        currentQuantity = 0;
                    }
                }
            }

            user.cooldowns.push({ name: 'chop', timestamp: Date.now(), duration: cooldownTime });
        });

        const embed = client.embed()
            .setColor(color.main)
            .setDescription(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft)
                    .replace('%{title}', "CHOPPING")
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

        return await ctx.sendMessage({embeds: [embed]});
    }
};

async function updateUserWithRetry(userId, updateFn, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const user = await Users.findOne({ userId }).exec();
            if (!user) {
                console.log(`User with ID ${userId} not found.`);
                return false;
            }
            await updateFn(user);
            await user.save();
            return true;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            if (error.name === 'VersionError') {
                retries++;
                if (retries === maxRetries) {
                    console.log(`Max retries reached for user ${userId}.`);
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
        hand: { amount: 1, rare: 0.08, common: 0.05, legendary: 0.03 },
        axe: { amount: Chance.integer({ min: 1, max: 1.2 }), rare: 0.11, common: 0.07, legendary: 0.04 },
    };

    const probabilities = toolProbabilities[tool?.id] || toolProbabilities.hand;
    const numItems = quantity * probabilities.amount;
    const generatedItems = [];
    for (let i = 0; i < numItems; i++) {
        const rarity = getRarity(probabilities);
        const item = generateRandomItem(rarity);
        if (item) {
            generatedItems.push(item);
        }
    }
    return generatedItems;
}

function getRarity(probabilities) {
    const rand = Math.random();
    if (rand < probabilities.legendary) return 'legendary';
    if (rand < probabilities.rare + probabilities.legendary) return 'rare';
    return 'common';
}

function generateRandomItem(rarity) {
    const items = Woods.filter(item => item.rarity === rarity && item.type === 'wood');
    if (items.length === 0) return null;

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

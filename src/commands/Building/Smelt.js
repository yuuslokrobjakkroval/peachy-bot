const { Command } = require('../../structures/index.js');
const Minerals = require('../../assets/inventory/Base/Minerals.js');
const globalEmoji = require('../../utils/Emoji');

module.exports = class Smelt extends Command {
    constructor(client) {
        super(client, {
            name: 'smelt',
            description: {
                content: 'Smelt ores into metal bars using fuel!',
                examples: ['smelt bronze 5', 'smelt silver', 'smelt all'],
                usage: 'smelt <ore_type> [quantity|all]',
            },
            category: 'inventory',
            aliases: ['melt'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'ore',
                    description: 'The type of ore to smelt',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'Bronze Ore', value: 'bronzeore' },
                        { name: 'Silver Ore', value: 'silverore' },
                        { name: 'Gold Ore', value: 'goldore' },
                        { name: 'Osmium Ore', value: 'osmiumore' },
                    ],
                },
                {
                    name: 'quantity',
                    description: "Amount to smelt (default: 1, use 'all' for maximum)",
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    createProgressBar(current, total, length = 20) {
        const percentage = Math.round((current / total) * 100);
        const filledLength = Math.round((length * current) / total);
        const emptyLength = length - filledLength;

        const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        return `\`[${bar}]\` **${current}/${total}** (${percentage}%)`;
    }

    async run(client, ctx, args, color, emoji, language) {
        const author = ctx.author;
        const user = await client.utils.getCachedUser(author.id);

        if (!user) {
            return await client.utils.sendErrorMessage(client, ctx, 'You need to register first! Use the `/register` command.', color);
        }

        // Parse arguments - handle both text and slash commands
        const oreType = args[0]?.toLowerCase() || ctx.options?.getString('ore');
        const quantity = args[1] || ctx.options?.getString('quantity') || '1';

        if (!oreType) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                'Please specify an ore type! Available: `bronzeore`, `silverore`, `goldore`, `osmiumore`',
                color
            );
        }

        // Normalize ore type names - support both short and long forms
        const oreMap = {
            bronze: 'bronzeore',
            silver: 'silverore',
            gold: 'goldore',
            osmium: 'osmiumore',
            bronzeore: 'bronzeore',
            silverore: 'silverore',
            goldore: 'goldore',
            osmiumore: 'osmiumore',
        };

        const normalizedOre = oreMap[oreType];
        if (!normalizedOre) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                'Invalid ore type! Available: `bronze`, `silver`, `gold`, `osmium`',
                color
            );
        }

        // Get ore and bar data
        const oreData = Minerals.find((m) => m.id === normalizedOre);

        // Map ores to their corresponding bars
        const barMap = {
            bronzeore: 'bronzebar',
            silverore: 'silverbar',
            goldore: 'goldbar',
            osmiumore: 'osmiumbar',
        };

        const barType = barMap[normalizedOre];
        const barData = Minerals.find((m) => m.id === barType);

        if (!oreData || !barData) {
            return await client.utils.sendErrorMessage(client, ctx, 'Invalid ore or corresponding bar not found!', color);
        }

        // Check user's ore inventory
        const userOre = user.inventory.find((item) => item.id === normalizedOre);
        if (!userOre || userOre.quantity < 1) {
            return await client.utils.sendErrorMessage(client, ctx, `❌ You don't have any **${oreData.name}** to smelt!`, color);
        }

        // Double-check ore quantity
        if (!userOre || userOre.quantity < 1) {
            return await client.utils.sendErrorMessage(client, ctx, `❌ You need at least 1 **${oreData.name}** to smelt!`, color);
        }

        // Calculate quantity to smelt
        let smeltAmount;
        if (quantity.toLowerCase() === 'all') {
            smeltAmount = userOre.quantity;
        } else {
            smeltAmount = parseInt(quantity);
            if (smeltAmount > userOre.quantity) {
                return await client.utils.sendErrorMessage(client, ctx, "You don't have enough ore to smelt that quantity!", color);
            } else {
                if (isNaN(smeltAmount) || smeltAmount <= 0) {
                    return await client.utils.sendErrorMessage(client, ctx, "Invalid quantity! Use a positive number or 'all'.", color);
                }
            }
        }

        // Check for fuel (coal)
        const coalNeeded = Math.ceil(smeltAmount / 2); // 1 coal per 2 ores
        const coalInfo = Minerals.find((i) => i.id === 'coal');
        const userCoal = user.inventory.find((item) => item.id === 'coal');
        if (!userCoal || userCoal.quantity < coalNeeded) {
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                `You need ${coalNeeded} ${coalInfo.emoji || '⛽'} Coal to smelt ${smeltAmount} ore! You have ${userCoal?.quantity || 0}.`,
                color
            );
        }

        // Check cooldown
        const cooldown = user.cooldowns.find((c) => c.name === 'smelt');
        const cooldownTime = 15000; // 15 seconds
        const isOnCooldown = cooldown ? Date.now() - cooldown.timestamp < cooldownTime : false;

        if (isOnCooldown) {
            const remainingTime = Math.ceil((cooldown.timestamp + cooldownTime - Date.now()) / 1000);
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                `The smelter is still hot! Please wait <t:${Math.round(Date.now() / 1000) + remainingTime}:R>.`,
                color,
                remainingTime * 1000
            );
        }

        // Calculate success rate based on rarity
        const successRate =
            {
                common: 0.95,
                uncommon: 0.85,
                rare: 0.75,
                legendary: 0.65,
            }[oreData.rarity] || 0.95;

        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        // Initialize animation variables
        let successfulSmelts = 0;
        let failedSmelts = 0;
        const smeltDelay = 1000; // 1 second per ore animation

        // Create initial embed
        const initialEmbed = client
            .embed()
            .setColor(color.main)
            .setTitle(`${author.displayName}'s Furnace`)
            .setDescription(
                `\n # 『  ${oreData.emoji}${this.client.utils.toSmall(smeltAmount.toString())} 』\n` +
                    `# 『  ${globalEmoji.smelt.fire}${this.client.utils.toSmall(coalNeeded.toString())} 』\n` +
                    `# 『  ${barData.emoji}${this.client.utils.toSmall('0')} 』`
            );

        const startMsg = await ctx.sendMessage({ embeds: [initialEmbed] });

        // Recursive smelting animation
        const animateSmelting = async (remainingOre, coalNeeded, completedBars) => {
            if (remainingOre <= 0) {
                // Animation complete
                return;
            }

            const isSuccess = Math.random() < successRate;
            let newCompletedBars = completedBars;

            if (isSuccess) {
                successfulSmelts++;
                newCompletedBars += 1;
            } else {
                failedSmelts++;
            }

            const remainingNext = remainingOre - 1;
            const remainingCoal = coalNeeded - 1;
            // Create animated embed
            const animEmbed = client
                .embed()
                .setColor(color.main)
                .setTitle(`${author.displayName}'s Furnace`)
                .setDescription(
                    `\n # 『  ${oreData.emoji}${this.client.utils.toSmall(remainingNext.toString())} 』\n` +
                        `# 『  ${globalEmoji.smelt.fire}${coalNeeded > 0 ? this.client.utils.toSmall(coalNeeded.toString()) : ''} 』\n` +
                        `# 『  ${barData.emoji}${this.client.utils.toSmall(newCompletedBars.toString())} 』`
                );

            try {
                await startMsg.edit({ embeds: [animEmbed] });
            } catch (e) {
                // Message already deleted or edit failed, continue
            }

            // Delay before next iteration
            await new Promise((resolve) => setTimeout(resolve, smeltDelay));

            // Recursive call for next ore
            await animateSmelting(remainingNext, remainingCoal, newCompletedBars);
        };

        // Start the animation
        await animateSmelting(smeltAmount, coalNeeded, 0);
        // Update user inventory
        await client.utils.updateUserWithRetry(author.id, async (user) => {
            // Remove ore and coal
            const oreItem = user.inventory.find((item) => item.id === normalizedOre);
            oreItem.quantity -= smeltAmount;
            if (oreItem.quantity <= 0) {
                user.inventory = user.inventory.filter((item) => item.id !== normalizedOre);
            }

            const coalItem = user.inventory.find((item) => item.id === 'coal');
            coalItem.quantity -= coalNeeded;
            if (coalItem.quantity <= 0) {
                user.inventory = user.inventory.filter((item) => item.id !== 'coal');
            }

            // Add bars if successful
            if (successfulSmelts > 0) {
                const existingBar = user.inventory.find((item) => item.id === barType);
                if (existingBar) {
                    existingBar.quantity += successfulSmelts;
                } else {
                    user.inventory.push({ id: barType, quantity: successfulSmelts });
                }
            }

            // Update cooldown
            const existingCooldown = user.cooldowns.find((c) => c.name === 'smelt');
            if (existingCooldown) {
                existingCooldown.timestamp = Date.now();
            } else {
                user.cooldowns.push({
                    name: 'smelt',
                    timestamp: Date.now(),
                    duration: cooldownTime,
                });
            }
        });

        let resultText = '';
        if (successfulSmelts > 0) {
            resultText += `**Received:**\n`;
            resultText += `${barData.emoji} **+${successfulSmelts}** ${barData.name}\n`;
        }
        if (failedSmelts > 0) {
            resultText += `💨 **${failedSmelts}** ore(s) failed to smelt\n`;
        }
        resultText += `**Resources Used:**\n`;
        resultText += `${oreData.emoji} **-${smeltAmount}** ${oreData.name}\n`;
        resultText += `${coalInfo.emoji || '⛽'} **-${coalNeeded}** Coal`;

        const finalEmbed = client
            .embed()
            .setColor(color.main)
            .setTitle(`${author.displayName}'s Furnace - Complete!`)
            .setDescription(`${resultText}`)
            .setFooter({
                text:
                    generalMessages?.requestedBy?.replace('%{username}', ctx.author.displayName) ||
                    `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            });
        this.getHeatLevel;

        return await startMsg.edit({ embeds: [finalEmbed] });
    }
};

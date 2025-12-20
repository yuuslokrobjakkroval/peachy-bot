const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const Woods = require('../../assets/inventory/Base/Woods.js');
const Minerals = require('../../assets/inventory/Base/Minerals.js');
const Fishs = require('../../assets/inventory/Base/Fishs.js');
const Slimes = require('../../assets/inventory/Base/Slime.js');
const Bugs = require('../../assets/inventory/Base/Bugs.js');
const ChopTools = require('../../assets/inventory/Tools/Chop.js');
const MineTools = require('../../assets/inventory/Tools/Mine.js');
const FishTools = require('../../assets/inventory/Tools/Fishing.js');
const SlimeTools = require('../../assets/inventory/Tools/Slime.js');
const BugTools = require('../../assets/inventory/Tools/Bug.js');
const Tools = [...ChopTools, ...MineTools, ...FishTools, ...SlimeTools, ...BugTools];
const Inventory = ShopItems.flatMap((shop) => shop.inventory);
const Items = Inventory.filter((value) => value.price.buy !== 0).sort((a, b) => a.price.buy - b.price.buy);

module.exports = class Inventory extends Command {
    constructor(client) {
        super(client, {
            name: 'inventory',
            description: {
                content: 'Shows your inventory.',
                examples: ['inventory'],
                usage: 'inventory',
            },
            category: 'inventory',
            aliases: ['inv'],
            cooldown: 5,
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
        const invMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.invMessages;

        try {
            const user = await client.utils.getUser(ctx.author.id);

            if (!user || !user.inventory) {
                return await client.utils.sendErrorMessage(
                    client,
                    ctx,
                    invMessages.noInventory || 'No inventory data found for this user.',
                    color
                );
            }

            // Define category icons/emojis for better visual distinction
            const categoryIcons = {
                resources: '⛏️',
                card: '💳',
                milk: '🥤',
                couple: '💑',
                ring: '💍',
                color: '🎨',
                decoration: '🏠',
                theme: '🎭',
                specialTheme: '🎭',
                wallpaper: '🖼️',
            };

            const allCategories = [
                'resources',
                'card',
                'milk',
                'couple',
                'ring',
                'color',
                'decoration',
                'theme',
                'specialTheme',
                'wallpaper',
            ];

            const itemList = {};
            let totalWorth = 0;
            let totalItems = 0;

            // Process inventory items
            user.inventory.forEach((item) => {
                if (item.quantity > 0) {
                    const itemInfo = Items.concat(ImportantItems, Woods, Minerals, Fishs, Slimes, Bugs, Tools).find(
                        ({ id }) => id.toLowerCase() === item.id.toLowerCase()
                    );

                    if (itemInfo) {
                        // Map specific types to "resources"
                        let type = itemInfo.type;
                        if (['tool', 'wood', 'mineral', 'fish', 'slime', 'bug'].includes(type)) {
                            type = 'resources';
                        }

                        itemList[type] = itemList[type] || [];

                        // Format item name
                        const itemName = itemInfo.name ? itemInfo.name : client.utils.formatCapitalize(itemInfo.id);

                        // Calculate item worth
                        const itemWorth = (itemInfo.price?.sell || 0) * item.quantity;

                        // Create item object
                        const itemObj = {
                            id: itemInfo.id,
                            emoji: itemInfo.emoji || '📦',
                            quantity: item.quantity,
                            name: itemName,
                            rarity: itemInfo.rarity || 'common',
                            worth: itemWorth,
                            type: type,
                            display: `${itemInfo.emoji || '📦'} **${itemName}** x**${item.quantity}**`,
                        };

                        // Add to category list
                        itemList[type].push(itemObj);

                        // Update totals
                        if (itemInfo.price?.sell) {
                            totalWorth += itemWorth;
                        }
                        totalItems += item.quantity;
                    }
                }
            });

            // Create category dropdown
            const categoryOptions = allCategories
                .filter((cat) => itemList[cat] && itemList[cat].length > 0)
                .map((cat) => {
                    const count = itemList[cat]?.length || 0;
                    return {
                        emoji: categoryIcons[cat] || '📦',
                        label: client.utils.formatCapitalize(cat),
                        description: `${count} items`,
                        value: cat,
                    };
                });

            // If no items at all
            if (categoryOptions.length === 0) {
                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(`${emoji.mainLeft} **INVENTORY** ${emoji.mainRight}\n\n` + 'Your inventory is currently empty.')
                    .setThumbnail(client.utils.emojiToImage(emoji.inventory || emoji.main))
                    .setFooter({
                        text: `Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });

                return ctx.sendMessage({ embeds: [embed] });
            }

            // Create overview embed
            const generateOverviewEmbed = () => {
                const categoryList = allCategories
                    .filter((cat) => itemList[cat] && itemList[cat].length > 0)
                    .map((cat) => {
                        const count = itemList[cat]?.length || 0;
                        return `${categoryIcons[cat]} **${client.utils.formatCapitalize(cat)}** - \`${count}\``;
                    })
                    .join('\n');

                return client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        `${emoji.mainLeft} **INVENTORY** ${emoji.mainRight}\n\n` +
                            `**Total Items:** **${totalItems}**\n` +
                            `**Total Worth:** **${client.utils.formatNumber(totalWorth)}** ${emoji.coin}\n\n` +
                            categoryList
                    )
                    .setThumbnail(client.utils.emojiToImage(emoji.inventory || emoji.main))
                    .setFooter({
                        text: `Select a category • Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });
            };

            // Create category embed
            const generateCategoryEmbed = (category) => {
                const items = itemList[category] || [];
                const categoryWorth = items.reduce((sum, item) => sum + item.worth, 0);

                // Create a source map for sorting by original index
                const allSources = Items.concat(ImportantItems, Woods, Minerals, Fish, SlimeCategory, Tools);

                const itemsList = items
                    .sort((a, b) => {
                        const indexA = allSources.findIndex((item) => item.id.toLowerCase() === a.id.toLowerCase());
                        const indexB = allSources.findIndex((item) => item.id.toLowerCase() === b.id.toLowerCase());
                        return indexA - indexB;
                    })
                    .map((item) => {
                        return `\`${item.id}\` ${item.emoji} **${item.name}** x**${item.quantity}**`;
                    })
                    .join('\n');

                return client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        `# ${categoryIcons[category]} **${client.utils.formatCapitalize(category).toUpperCase()}**\n\n` +
                            `**Items:** **${items.length}**\n` +
                            `**Worth:** **${client.utils.formatNumber(categoryWorth)}** ${emoji.coin}`
                    )
                    .addFields({
                        name: 'Items',
                        value: itemsList || 'No items',
                        inline: false,
                    })
                    .setThumbnail(client.utils.emojiToImage(emoji.inventory || emoji.main))
                    .setFooter({
                        text: `Select another category • Requested by ${ctx.author.displayName}`,
                        iconURL: ctx.author.displayAvatarURL(),
                    });
            };

            // Initial view is overview
            let currentView = 'overview';

            // Create dropdown menu
            const categorySelectMenu = new StringSelectMenuBuilder()
                .setCustomId('category_select')
                .setPlaceholder('📦 Select a category')
                .addOptions(categoryOptions);

            const selectRow = new ActionRowBuilder().addComponents(categorySelectMenu);

            // Send initial message
            const message = await ctx.sendMessage({
                embeds: [generateOverviewEmbed()],
                components: [selectRow],
            });

            // Create collector for interactions
            const collector = message.createMessageComponentCollector({
                filter: (i) => i.user.id === ctx.author.id,
                time: 180000, // 3 minutes
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'category_select') {
                    const selectedCategory = interaction.values[0];
                    currentView = selectedCategory;

                    const backButton = new ButtonBuilder()
                        .setCustomId('back_to_overview')
                        .setLabel('← Back')
                        .setStyle(ButtonStyle.Secondary);

                    const buttonRow = new ActionRowBuilder().addComponents(backButton);

                    await interaction.update({
                        embeds: [generateCategoryEmbed(selectedCategory)],
                        components: [selectRow, buttonRow],
                    });
                } else if (interaction.customId === 'back_to_overview') {
                    currentView = 'overview';
                    await interaction.update({
                        embeds: [generateOverviewEmbed()],
                        components: [selectRow],
                    });
                }
            });

            collector.on('end', () => {
                message.edit({ components: [] }).catch(() => {});
            });

            return message;
        } catch (error) {
            console.error('Error in Inventory command:', error);
            return await client.utils.sendErrorMessage(
                client,
                ctx,
                invMessages.error || 'An error occurred while retrieving your inventory.',
                color
            );
        }
    }
};

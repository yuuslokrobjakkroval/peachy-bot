const { Command } = require('../../structures/index.js');
const Users = require("../../schemas/user");
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Items = inventory.filter(value => value.price.buy !== 0).sort((a, b) => a.price.buy - b.price.buy);

module.exports = class Inventory extends Command {
    constructor(client) {
        super(client, {
            name: 'inventory',
            description: {
                content: 'Shows your inventory.',
                examples: ['inventory'],
                usage: 'inventory',
            },
            cooldown: 5,
            category: 'inventory',
            aliases: ['inv'],
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
            // Retrieve user data
            const user = await Users.findOne({ userId: ctx.author.id });
            if (!user || !user.inventory) {
                // Use localized error message
                return await client.utils.sendErrorMessage(
                    client,
                    ctx,
                    invMessages.noInventory || 'No inventory data found for this user.', // Fallback in case localization key is missing
                    color
                );
            }

            const itemList = {};
            let totalWorth = 0;

            // Loop through user's inventory and calculate total worth
            user.inventory.forEach(item => {
                if (item.quantity > 0) {
                    const itemInfo = Items.concat(ImportantItems).find(({ id }) => id === item.id);

                    if (itemInfo) {
                        const type = itemInfo.type;
                        itemList[type] = itemList[type] || [];
                        itemList[type].push(
                            `${itemInfo.emoji} **\`${item.quantity}\`** ${itemInfo.name ? itemInfo.name : client.utils.toNameCase(itemInfo.id)}`
                        );
                        if (itemInfo.type === 'milk') {
                            totalWorth += itemInfo.price.sell * item.quantity;
                        }
                    }
                }
            });

            const fields = [];
            const inventoryTypes = ['milk', 'food', 'drink', 'theme'];

            // Organize items by type and ensure they fit into Discord's embed field length limits
            inventoryTypes.forEach(type => {
                const items = itemList[type];  // Extract the items of this type
                if (items && items.length > 0) {
                    let chunk = [];
                    let chunkLength = 0;
                    // const isInline = type !== 'milk';  // Inline true only for non-'milk' types

                    items.forEach(item => {
                        if (chunkLength + item.length + 1 > 1024) {
                            fields.push({
                                name: client.utils.toNameCase(type),
                                value: chunk.join('\n'),
                                inline: false,
                            });
                            chunk = [];
                            chunkLength = 0;
                        }
                        chunk.push(item);
                        chunkLength += item.length + 1;
                    });

                    if (chunk.length > 0) {
                        fields.push({
                            name: client.utils.toNameCase(type),
                            value: chunk.join('\n'),
                            inline: false,
                        });
                    }
                }
            });

            const embedFields = [
                {
                    name: invMessages.inventoryNet || 'Inventory Net',
                    value: `**\`${client.utils.formatNumber(totalWorth)}\`** ${emoji.coin}`,
                    inline: false,
                },
                ...(fields.length ? fields : [
                    {
                        name: invMessages.emptyInventoryFieldName || 'Inventory',
                        value: invMessages.emptyInventoryFieldValue || 'Your inventory is currently empty.',
                    },
                ])
            ];

            // Build the embed
            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(`## ${emoji.inventory.mainLeft} ${invMessages.inventoryTitle || '𝐈𝐍𝐕𝐄𝐍𝐓𝐎𝐑𝐘'} ${emoji.inventory.mainRight}`)
                .setThumbnail(client.utils.emojiToImage(emoji.inventory.main))
                .addFields(embedFields)
                .setFooter({
                    text: invMessages.footerText?.replace('{user}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Inventory command:', error);
            await client.utils.sendErrorMessage(
                client,
                ctx,
                invMessages.error || 'An error occurred while retrieving your inventory.',  // Fallback message
                color
            );
        }
    }
};

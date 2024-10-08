const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');
const ImportantItems = require('../../assets/inventory/ImportantItems.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const inventory = ShopItems.flatMap(shop => shop.inventory);
const Items = inventory.filter(value => value.price.buy !== 0).sort((a, b) => a.price.buy - b.price.buy);

module.exports = class UserInventory extends Command {
    constructor(client) {
        super(client, {
            name: 'userinventory',
            description: {
                content: 'Shows the user inventory.',
                examples: ['userinventory @user'],
                usage: 'userinventory <user>',
            },
            cooldown: 5,
            category: 'developer',
            aliases: ['ui'],
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const target = ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.author;
            const user = await Users.findOne({ userId: target.id });
            const isBot = target ? target.bot : false;
            if (isBot) return await client.utils.sendErrorMessage(client, ctx, client.i18n.get(language, 'commands', 'mention_to_bot'), color);

            const itemList = {};
            let totalWorth = 0;
            user.inventory.forEach(item => {
                if (item.quantity > 0) {
                    const itemInfo = Items.concat(ImportantItems).find(({ id }) => id === item.id);

                    if (itemInfo) {
                        const type = itemInfo.type;
                        itemList[type] = itemList[type] || [];
                        itemList[type].push(
                            `${itemInfo.emoji} **\`${item.quantity}\`** ${itemInfo.name ? itemInfo.name : client.utils.toNameCase(itemInfo.id)}`
                        );
                        if (itemInfo.id !== 'milk') {
                            totalWorth += itemInfo.price.sell * item.quantity;
                        }
                    }
                }
            });

            const fields = [];
            const inventoryTypes = ['milk', 'food', 'drink', 'theme'];

            inventoryTypes.forEach(type => {
                const items = itemList[type];  // Extract the items of this type
                if (items && items.length > 0) {
                    let chunk = [];
                    let chunkLength = 0;
                    const isInline = type !== 'milk';  // Inline true only for 'tool'

                    items.forEach(item => {
                        if (chunkLength + item.length + 1 > 1024) {
                            fields.push({
                                name: client.utils.toNameCase(type),
                                value: chunk.join('\n'),
                                inline: isInline,
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
                            inline: isInline,
                        });
                    }
                }
            });


            const embedFields = [
                {
                    name: 'Inventory Net',
                    value: `**\`${client.utils.formatNumber(totalWorth)}\`** ${emoji.coin}`,
                    inline: false,
                },
                ...(fields.length ? fields : [
                    {
                        name: client.i18n.get(language, 'commands', 'inventory_fields_name'),
                        value: client.i18n.get(language, 'commands', 'inventory_fields_value'),
                    },
                ])
            ];

            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(`## ${emoji.inventory.mainLeft} 𝐈𝐍𝐕𝐄𝐍𝐓𝐎𝐑𝐘 ${emoji.inventory.mainRight}`)
                .setThumbnail(client.utils.emojiToImage(emoji.inventory.main))
                .addFields(embedFields)
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })

            await ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Inventory command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while retrieving your inventory.', color);
        }
    }
};

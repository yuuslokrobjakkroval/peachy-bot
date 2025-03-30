const { Command } = require("../../structures/index.js");
const ImportantItems = require("../../assets/inventory/ImportantItems.js");
const ShopItems = require("../../assets/inventory/ShopItems.js");
const Woods = require("../../assets/inventory/Woods");
const Minerals = require("../../assets/inventory/Minerals");
const ChopTools = require("../../assets/inventory/ChopTools");
const MineTools = require("../../assets/inventory/MineTools");
const inventory = ShopItems.flatMap((shop) => shop.inventory);
const Items = inventory.filter((value) => value.price.buy !== 0).sort((a, b) => a.price.buy - b.price.buy);

module.exports = class Inventory extends Command {
    constructor(client) {
        super(client, {
            name: "beg",
            description: {
                content: "Shows your beg.",
                examples: ["beg"],
                usage: "beg",
            },
            cooldown: 5,
            category: "building",
            aliases: ["b"],
            args: false,
            permissions: {
                dev: false,
                client: ["SendMessages", "ViewChannel", "EmbedLinks"],
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
                    invMessages.noInventory || "No inventory data found for this user.",
                    color
                );
            }

            const itemList = {};
            let totalWorth = 0;

            user.inventory.forEach((item) => {
                if (item.quantity > 0) {
                    const itemInfo = Items.concat(ImportantItems, Woods, Minerals, ChopTools, MineTools).find(
                        ({ id }) => id === item.id
                    );

                    if (itemInfo) {
                        const type = itemInfo.type;
                        itemList[type] = itemList[type] || [];
                        itemList[type].push(
                            `\`${itemInfo.id}\` ${itemInfo.emoji} **${item.quantity}** ${
                                itemInfo.name ? itemInfo.name : client.utils.formatCapitalize(itemInfo.id)
                            }`
                        );
                        if (itemInfo.type === "milk") {
                            totalWorth += itemInfo.price.sell * item.quantity;
                        }
                    }
                }
            });

            const fields = [];
            const inventoryTypes = ["tool", "wood", "mine", "mineral", "ore", "metalbar"];

            inventoryTypes.forEach((type) => {
                const items = itemList[type];
                if (items && items.length > 0) {
                    let chunk = [];
                    let chunkLength = 0;

                    items.forEach((item) => {
                        if (chunkLength + item.length + 1 > 1024) {
                            fields.push({
                                name: client.utils.formatCapitalize(type),
                                value: chunk.join("\n"),
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
                            name: client.utils.formatCapitalize(type),
                            value: chunk.join("\n"),
                            inline: false,
                        });
                    }
                }
            });

            const embedFields = [
                {
                    name: "Beg Net",
                    value: `**\`${client.utils.formatNumber(totalWorth)}\`** ${emoji.coin}`,
                    inline: false,
                },
                ...(fields.length
                    ? fields
                    : [
                        {
                            name: "Beg",
                            value: "Your beg is currently empty.",
                        },
                    ]),
            ];

            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(`## ${emoji.mainLeft} Beg ${emoji.mainRight}`)
                .setThumbnail(client.utils.emojiToImage(emoji.main))
                .addFields(embedFields)
                .setFooter({
                    text:
                        invMessages.footerText?.replace("{user}", ctx.author.displayName) ||
                        `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            return await ctx.sendMessage({ embeds: [embed] });

        } catch (error) {
            console.error("Error in beg command:", error);
            return await client.utils.sendErrorMessage(client, ctx, invMessages.error || "An error occurred while retrieving your beg.", color);
        }
    }
};

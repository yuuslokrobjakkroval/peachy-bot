const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { formatString, formatCapitalize } = require('../../utils/Utils.js');
const { emojiButton } = require('../../functions/function');
const gif = require('../../utils/Gif.js');
const ShopItems = require('../../assets/inventory/ShopItems.js');
const Shops = [...ShopItems];

module.exports = class Shop extends Command {
    constructor(client) {
        super(client, {
            name: 'shop',
            description: {
                content: 'View which items you can buy.',
                examples: ['shop'],
                usage: 'shop',
            },
            cooldown: 5,
            category: 'inventory',
            aliases: ['store'],
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
        const shopMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.shopMessages; // Access shopMessages
        const categories = Shops.map(shop => shop.type);
        let selectedCategory = args[0] || categories[0];
        let selectedShop = Shops.find(shop => shop.type === selectedCategory);
        let items = selectedShop.inventory;

        const pages = [];
        const itemsPerPage = 10;
        const totalPages = Math.ceil(items.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const currentItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            const itemList = currentItems.map(item => {
                let id = item.id ? item.id : shopMessages?.unknownItemId;
                let name = item.name ? item.name : shopMessages?.unnamedItem;
                return `**${id}** ${item.emoji} ${name} - ${formatString(item.price.buy)} \` ${emoji.coin} \``;
            }).join('\n');

            const embed = client
                .embed()
                .setColor(color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`# ${emoji.shop.mainLeft} ${shopMessages?.shopTitle}: ${selectedShop.name} ${emoji.shop.mainRight}\n${selectedShop.description}\n${itemList}`)
                .setImage(selectedCategory === 'food' ? gif.foodShop : gif.drinkShop)
                .setFooter({
                    text: shopMessages?.requestedBy.replace('%{user}', ctx.author.displayName),
                    iconURL: ctx.author.displayAvatarURL(),
                });

            pages.push({ embed });
        }

        await paginate(client, ctx, color, emoji, pages, categories, selectedCategory, itemsPerPage, language);
    }
};

async function paginate(client, ctx, color, emoji, pages, categories, selectedCategory, itemsPerPage, language) {
    const shopMessages = language.locales.get(language.defaultLocale)?.inventoryMessages?.shopMessages; // Access shopMessages
    let page = 0;
    let selectedItemIndex = null;
    let items = Shops.find(shop => shop.type === selectedCategory).inventory;

    const updatePages = (selectedCategory) => {
        const selectedShop = Shops.find(shop => shop.type === selectedCategory);
        items = selectedShop.inventory;

        pages.length = 0;
        const totalPages = Math.ceil(items.length / itemsPerPage);

        const maxIdLength = 3;
        const maxNameLength = 13;

        for (let i = 0; i < totalPages; i++) {
            const currentItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);

            const itemList = currentItems.map(item => {
                let price = formatString(item.price.buy);
                let id = item.id ? item.id : shopMessages?.unknownItemId;
                let name = item.name ? item.name : shopMessages?.unnamedItem;

                let idPadding = ' '.repeat(Math.max(0, maxIdLength - id.length));
                let namePadding = ' '.repeat(Math.max(0, maxNameLength - name.length));

                return `\`${id}\`${idPadding} ${item.emoji} \`${name}${namePadding}${price}\` ${emoji.coin}`;
            }).join('\n');

            const embed = client
                .embed()
                .setColor(color.main)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`# ${emoji.shop.mainLeft} ${shopMessages?.shopTitle}: ${selectedShop.name} ${emoji.shop.mainRight}\n${selectedShop.description}\n\n${itemList}`)
                .setImage(selectedCategory === 'food' ? gif.foodShop : gif.drinkShop)
                .setFooter({
                    text: shopMessages?.requestedBy.replace('%{user}', ctx.author.displayName),
                    iconURL: ctx.author.displayAvatarURL(),
                });

            pages.push({ embed });
        }
    };

    const getButtonRow = (selectedItemIndex, items) => {
        const homeButton = emojiButton('home', '🏠', 2);
        const prevButton = emojiButton('prev_item', '⬅️', 2);
        const nextButton = emojiButton('next_item', '➡️', 2);

        const filterButton = new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder(shopMessages?.selectCategoryPlaceholder)
            .addOptions(categories.map(cat => ({
                label: Shops.find(shop => shop.type === cat).name,
                value: cat,
                default: cat === selectedCategory
            })));

        const itemSelectButton = new StringSelectMenuBuilder()
            .setCustomId('item_select')
            .setPlaceholder(shopMessages?.selectItemPlaceholder)
            .addOptions(items.map(item => ({
                label: item.name || shopMessages?.unnamedItem,
                value: item.id || shopMessages?.unknownItemId,
                default: item.id === items[selectedItemIndex]?.id
            })).slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage));

        const row1 = new ActionRowBuilder().addComponents(filterButton);
        const row2 = new ActionRowBuilder().addComponents(itemSelectButton);
        const row3 = new ActionRowBuilder().addComponents(homeButton, prevButton, nextButton);

        return { components: [row1, row2, row3], embeds: [pages[page].embed] };
    };

    const displayItemDetails = (selectedItemIndex) => {
        const item = items[selectedItemIndex];

        const embed = client
            .embed()
            .setColor(color.main)
            .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`# ${shopMessages?.itemDetail}\n${emoji.shop.mainLeft}  ${item.name || shopMessages?.unnamedItem} ${emoji.shop.mainRight}\n**ID:** \`${item.id || shopMessages?.unknownItemId}\`\n**Description:** ${item.description || shopMessages?.noDescription}\n**Price:** ${formatString(item.price.buy)} ${emoji.coin}\n**Type:** ${formatCapitalize(item.type || shopMessages?.unknownType)}`)
            .setImage(client.utils.emojiToImage(item.emoji))
            .setFooter({
                text: shopMessages?.requestedBy.replace('%{user}', ctx.author.displayName),
                iconURL: ctx.author.displayAvatarURL(),
            });

        return { embed };
    };

    updatePages(selectedCategory);
    const messageOptions = getButtonRow(selectedItemIndex, items);
    const msg = ctx.isInteraction
        ? await ctx.interaction.reply({ ...messageOptions, fetchReply: true })
        : await ctx.channel.send({ ...messageOptions, fetchReply: true });

    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === ctx.author.id,
        time: 300000,
    });

    collector.on('collect', async int => {
        if (int.customId === 'home') {
            selectedCategory = categories[0];
            updatePages(selectedCategory);
            selectedItemIndex = null;
            page = 0;
            await int.update({
                embeds: [pages[page]?.embed],
                components: getButtonRow(selectedItemIndex, items).components
            });
        } else if (int.customId === 'prev_item') {
            if (selectedItemIndex !== null) {
                selectedItemIndex--;
                if (selectedItemIndex < 0) selectedItemIndex = items.length - 1;
                const itemDetails = displayItemDetails(selectedItemIndex);
                await int.update({ embeds: [itemDetails.embed], components: getButtonRow(selectedItemIndex, items).components });
            } else {
                page--;
                if (page < 0) page = pages.length - 1;
                await int.update(getButtonRow(selectedItemIndex, items));
            }
        } else if (int.customId === 'next_item') {
            if (selectedItemIndex !== null) {
                selectedItemIndex++;
                if (selectedItemIndex >= items.length) selectedItemIndex = 0;
                const itemDetails = displayItemDetails(selectedItemIndex);
                await int.update({ embeds: [itemDetails.embed], components: getButtonRow(selectedItemIndex, items).components });
            } else {
                page++;
                if (page >= pages.length) page = 0;
                await int.update(getButtonRow(selectedItemIndex, items));
            }
        } else if (int.customId === 'category_select') {
            selectedCategory = int.values[0];
            updatePages(selectedCategory);
            selectedItemIndex = null;
            page = 0;
            await int.update(getButtonRow(selectedItemIndex, items));
        } else if (int.customId === 'item_select') {
            selectedItemIndex = items.findIndex(i => i.id === int.values[0]);
            await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow(selectedItemIndex, items).components });
        }
    });

    collector.on('end', () => {
        msg.edit({ components: [] });
    });
}

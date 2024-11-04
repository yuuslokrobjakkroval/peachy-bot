const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const categories = Shops.map(shop => shop.type);
        const categorySet = new Set(categories);
        if (categorySet.size !== categories.length) {
            console.error('Duplicate category values found:', categories);
        }
        let selectedCategory = args[0] || categories[0];
        let selectedShop = Shops.find(shop => shop.type === selectedCategory);

        if (!selectedShop) {
            console.error(`No shop found for category: ${selectedCategory}`);
            return;
        }
        let items = selectedShop.inventory;

        const pages = [];
        const itemsPerPage = 10;
        const totalPages = Math.ceil(items.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const currentItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            const itemList = currentItems.map(item => `**${item.id}** ${item.emoji} ${item.name} - ${client.utils.formatString(item.price.buy)} ${emoji.coin}`).join('\n');

            const embed = client
                .embed()
                .setColor(client.color.main)
                .setTitle(`𝐒𝐇𝐎𝐏 : ${selectedShop.name}`)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`${selectedShop.description}\n${itemList}`)
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })

            pages.push({ embed });
        }

        await paginate(client, ctx, color, emoji, pages, categories, selectedCategory, itemsPerPage, generalMessages);
    }
};

async function paginate(client, ctx, color, emoji, pages, categories, selectedCategory, itemsPerPage, generalMessages) {
    let page = 0;
    let selectedItemIndex = null;
    let items = pages[0].embed.fields; // Start with items from the first page

    const updatePages = (selectedCategory) => {
        const selectedShop = Shops.find(shop => shop.type === selectedCategory);
        items = selectedShop.inventory;

        pages.length = 0; // Clear existing pages
        const totalPages = Math.ceil(items.length / itemsPerPage);
        const charLen = 13;

        for (let i = 0; i < totalPages; i++) {
            const currentItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);

            const itemList = currentItems.map(item => {
                let price = client.utils.formatString(item.price.buy);
                // Ensure cLength is never negative
                let cLength = Math.max(0, charLen - item.name.length + (4 - price.length));
                return `\`${item.id}\` ${item.emoji} \`${item.name} ${' '.repeat(cLength)} ${price}\` ${emoji.coin}`;
            }).join('\n');

            const embed = client
                .embed()
                .setColor(color.main)
                .setTitle(`𝐒𝐇𝐎𝐏 : ${selectedShop.name}`)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`${selectedShop.description}\n\n${itemList}`)
                .setFooter({
                    text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                })

            pages.push({ embed });
        }
    };


    const getButtonRow = () => {
        const homeButton = client.utils.emojiButton('home', '🏠', 2);
        const prevButton = client.utils.emojiButton('prev_item', '⬅️', 2);
        const nextButton = client.utils.emojiButton('next_item', '➡️', 2);

        // Generate category options
        const categoryOptions = categories.map(cat => {
            const shop = Shops.find(shop => shop.type === cat);
            return {
                label: shop.name,
                value: cat,
                default: cat === selectedCategory,
            };
        });

        // Generate item options
        const itemOptions = items.map(item => ({
            label: item.name,
            value: item.id,
            default: item.id === items[selectedItemIndex]?.id,
        }));

        const filterButton = new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('Select a category')
            .addOptions(categoryOptions);

        const itemSelectButton = new StringSelectMenuBuilder()
            .setCustomId('item_select')
            .setPlaceholder('Select an item')
            .addOptions(itemOptions);

        const row1 = new ActionRowBuilder().addComponents(filterButton);
        const row2 = new ActionRowBuilder().addComponents(itemSelectButton);
        const row3 = new ActionRowBuilder().addComponents(homeButton, prevButton, nextButton);

        return { components: [row1, row2, row3], embeds: [pages[page].embed] };
    };

    const displayItemDetails = (selectedItemIndex) => {
        const item = items[selectedItemIndex];

        const embed = client
            .embed()
            .setColor(client.color.main)
            .setTitle(`𝐈𝐓𝐄𝐌 𝐃𝐄𝐓𝐀𝐈𝐋𝐒 : ${item.name}`)
            .setThumbnail(item.emoji ? client.utils.emojiToImage(item.emoji) : ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`**ID:** \`${item.id}\`\n**Description:** ${item.description}\n**Price:**  ${client.utils.formatString(item.price.buy)} ${emoji.coin}\n**Type:** ${client.utils.formatCapitalize(item.type)}`)
            .setImage(item.image)
            .setFooter({
                text: generalMessages.requestedBy.replace('%{username}', ctx.author.displayName) || `Requested by ${ctx.author.displayName}`,
                iconURL: ctx.author.displayAvatarURL(),
            })

        return { embed };
    };

    // Initial page setup
    updatePages(selectedCategory);
    const messageOptions = getButtonRow();
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
            page = 0;
            selectedItemIndex = null; // Reset item selection
            updatePages(selectedCategory); // Update pages for the default category
            await int.update(getButtonRow());
        } else if (int.customId === 'prev_item') {
            // Handle previous item
            if (selectedItemIndex !== null) {
                selectedItemIndex--;
                if (selectedItemIndex < 0) selectedItemIndex = items.length - 1;
                const itemDetails = displayItemDetails(selectedItemIndex);
                await int.update({ embeds: [itemDetails.embed], components: getButtonRow() });
            } else {
                // Handle previous page
                page--;
                if (page < 0) page = pages.length - 1;
                await int.update(getButtonRow());
            }
        } else if (int.customId === 'next_item') {
            // Handle next item
            if (selectedItemIndex !== null) {
                selectedItemIndex++;
                if (selectedItemIndex >= items.length) selectedItemIndex = 0;
                const itemDetails = displayItemDetails(selectedItemIndex);
                await int.update({
                    embeds: [itemDetails.embed],
                    components: getButtonRow(selectedItemIndex, items).components
                });
            } else {
                // Handle next page
                page++;
                if (page >= pages.length) page = 0;
                await int.update({
                    embeds: [pages[page].embed],
                    components: getButtonRow(selectedItemIndex, items).components
                });
            }
        }
        else if (int.customId === 'category_select') {
            selectedCategory = int.values[0];
            updatePages(selectedCategory);
            selectedItemIndex = null;
            page = 0;
            await int.update(getButtonRow());
        } else if (int.customId === 'item_select') {
            // Handle item selection
            selectedItemIndex = items.findIndex(i => i.id === int.values[0]);

            // Update the interaction response with the item details and correct button row
            await int.update({
                embeds: [displayItemDetails(selectedItemIndex).embed],
                components: getButtonRow(selectedItemIndex, items).components
            });
        }
    });

    collector.on('end', () => {
        msg.edit({ components: [] });
    });
}


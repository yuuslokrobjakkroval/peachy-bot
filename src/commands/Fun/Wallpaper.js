const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Wallpapers = require('../../assets/json/wallpapers.json');  // Your wallpaper JSON data
const { emojiButton } = require('../../functions/function');

const wallpaperCategories = [...new Set(Wallpapers.map(wallpaper => wallpaper.type))];  // Extract unique categories

module.exports = class Wallpaper extends Command {
    constructor(client) {
        super(client, {
            name: 'wallpaper',
            description: {
                content: 'View and select wallpapers for PC or Phone.',
                examples: ['wallpaper'],
                usage: 'wallpaper',
            },
            cooldown: 5,
            category: 'fun',
            aliases: ['wp'],
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
        let selectedCategory = args[0] || wallpaperCategories[0];  // Default to the first category
        let selectedWallpapers = Wallpapers.filter(wallpaper => wallpaper.type === selectedCategory);

        const pages = [];
        const itemsPerPage = 5;  // Adjust the number of wallpapers per page
        const totalPages = Math.ceil(selectedWallpapers.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const currentItems = selectedWallpapers.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            const wallpaperList = currentItems.map((wallpaper, index) => `${index + 1}. ${wallpaper.emoji} **${wallpaper.name}**`).join('\n\n');

            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} 𝐖𝐀𝐋𝐋𝐏𝐀𝐏𝐄𝐑𝐒 - ${client.utils.formatCapitalize(selectedCategory)} ${emoji.mainRight}`)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`${wallpaperList}`)
                .setFooter({ text: `Page ${i + 1} of ${totalPages}` });

            pages.push({ embed });
        }

        await paginateWallpapers(client, ctx, color, emoji, pages, selectedCategory, selectedWallpapers);
    }
};

async function paginateWallpapers(client, ctx, color, emoji, pages, selectedCategory, selectedWallpapers) {
    let page = 0;
    let selectedItemIndex = null; // For selecting specific wallpaper within the category
    const itemsPerPage = 5;  // Number of wallpapers per page

    const updatePages = (selectedCategory) => {
        selectedWallpapers = Wallpapers.filter(wallpaper => wallpaper.type === selectedCategory);

        pages.length = 0;  // Clear previous pages
        const totalPages = Math.ceil(selectedWallpapers.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const currentItems = selectedWallpapers.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            const wallpaperList = currentItems.map((wallpaper, index) => `${index + 1}. ${wallpaper.emoji} **${wallpaper.name}**`).join('\n\n');

            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} 𝐖𝐀𝐋𝐋𝐏𝐀𝐏𝐄𝐑𝐒 - ${client.utils.formatCapitalize(selectedCategory)} ${emoji.mainRight}`)
                .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`${wallpaperList}`)
                .setFooter({ text: `Page ${i + 1} of ${totalPages}` });

            pages.push({ embed });
        }
    };

    const getButtonRow = () => {
        const prevButton = emojiButton('prev_item', '⬅️', 2);
        const nextButton = emojiButton('next_item', '➡️', 2);

        const categoryOptions = wallpaperCategories
            .filter(cat => typeof cat === 'string')
            .map(cat => ({
                label: client.utils.formatCapitalize(cat),
                value: cat,
                default: cat === selectedCategory
            }));

        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('Select Wallpaper Category')
            .addOptions(categoryOptions);

        const itemOptions = selectedWallpapers
            .filter(item => item && item.id && typeof item.id === 'string')
            .map(item => ({
                label: item.name,
                value: item.id,
                default: item.id === selectedWallpapers[selectedItemIndex]?.id.toString()
            })).slice(page * itemsPerPage, (page + 1) * itemsPerPage);

        const itemSelect = new StringSelectMenuBuilder()
            .setCustomId('item_select')
            .setPlaceholder('Select a wallpaper')
            .addOptions(itemOptions.length ? itemOptions : [{ label: 'No wallpapers available', value: 'none' }]);

        const row1 = new ActionRowBuilder().addComponents(categorySelect);
        const row2 = new ActionRowBuilder().addComponents(itemSelect);
        const row3Components = [];
        if (selectedItemIndex !== null) {
            row3Components.push(prevButton, nextButton);
        }

        const row3 = row3Components.length > 0 ? new ActionRowBuilder().addComponents(row3Components) : null;

        return { components: [row1, row2, row3].filter(row => row !== null), embeds: [pages[page]?.embed] };
    };

    const displayItemDetails = (selectedItemIndex) => {
        const wallpaper = selectedWallpapers[selectedItemIndex];

        if (!wallpaper) {
            console.error('Wallpaper not found at index:', selectedItemIndex);
            return { embed: client.embed().setDescription('Wallpaper not found.').setColor(color.red) };
        }

        const embed = client.embed()
            .setColor(color.main)
            .setTitle(`𝐖𝐀𝐋𝐋𝐏𝐀𝐏𝐄𝐑 𝐃𝐄𝐓𝐀𝐈𝐋\n${emoji.mainLeft} ${wallpaper.name} ${emoji.mainRight}`)
            .setThumbnail(ctx.author.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`**ID : ${wallpaper.id}** \n**Description : ** ${wallpaper.description}\n**Category : ** ${client.utils.formatCapitalize(wallpaper.type)}`)
            .setImage(wallpaper.image);

        return { embed };
    };


    const msg = ctx.isInteraction
        ? await ctx.interaction.reply({ ...getButtonRow(), fetchReply: true })
        : await ctx.channel.send({ ...getButtonRow(), fetchReply: true });

    if (!msg) {
        console.error('Message could not be sent.');
        return;
    }

    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === ctx.author.id,
        time: 300000,  // 5 minutes
    });

    collector.on('collect', async int => {
        if (int.customId === 'prev_item') {
            if (selectedItemIndex !== null) {
                selectedItemIndex--;
                if (selectedItemIndex < 0) selectedItemIndex = selectedWallpapers.length - 1;
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            }
        } else if (int.customId === 'next_item') {
            if (selectedItemIndex !== null) {
                selectedItemIndex++;
                if (selectedItemIndex >= selectedWallpapers.length) selectedItemIndex = 0;
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            }
        } else if (int.customId === 'prev_page') {
            page--;
            if (page < 0) page = pages.length - 1;
            await int.update(getButtonRow());
        } else if (int.customId === 'next_page') {
            page++;
            if (page >= pages.length) page = 0;
            await int.update(getButtonRow());
        } else if (int.customId === 'category_select') {
            selectedCategory = int.values[0];
            updatePages(selectedCategory);
            page = 0;
            selectedItemIndex = null;
            await int.update(getButtonRow());
        } else if (int.customId === 'item_select') {
            selectedItemIndex = selectedWallpapers.findIndex(w => w.id.toString() === int.values[0]);
            if (selectedItemIndex !== -1) {
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            } else {
                await int.update({ embeds: [client.embed().setDescription('Wallpaper not found.').setColor(color.red)], components: getButtonRow().components });
            }
        }
    });

    collector.on('end', () => {
        msg.edit({ components: [] });
    });
}

const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Provinces = require('../../assets/json/provinces.json'); // Your province JSON data
const { emojiButton } = require('../../functions/function');

module.exports = class Province extends Command {
    constructor(client) {
        super(client, {
            name: 'province',
            description: {
                content: 'View and select provinces.',
                examples: ['province'],
                usage: 'province',
            },
            cooldown: 5,
            category: 'fun',
            aliases: ['pv', 'khet'],
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
        const province = language.locales.get(language.defaultLocale)?.funMessage?.province; // Localized province structure
        const selectedProvinces = Provinces; // All provinces

        const pages = [];
        const itemsPerPage = 5; // Adjust the number of provinces per page
        const totalPages = Math.ceil(selectedProvinces.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} ${province.title} ${emoji.mainRight}`) // Use province title
                .setImage('https://i.imgur.com/5CZWtLN.png')
                .setFooter({
                    text: `${province.requestBy} ${ctx.author.displayName}`, // Use province requestBy
                    iconURL: ctx.author.displayAvatarURL(),
                });

            pages.push({ embed });
        }

        await paginateProvinces(client, ctx, color, emoji, pages, province); // Pass the province object
    }
};

async function paginateProvinces(client, ctx, color, emoji, pages, province) { // Accept province object
    let page = 0;
    let selectedItemIndex = null; // No item selected initially
    let selectedProvinceName = province.selectProvince; // Use province selectProvince
    const totalProvinces = Provinces.length; // Total number of provinces

    const getButtonRow = () => {
        const homeButton = emojiButton('home', '🏠', 2); // Home button
        const prevButton = emojiButton('prev_item', '⬅️', 2);
        const nextButton = emojiButton('next_item', '➡️', 2);

        const itemOptions = Provinces.map(item => ({
            label: item.name,
            value: item.id,
        }));

        const itemSelect = new StringSelectMenuBuilder()
            .setCustomId('item_select')
            .setPlaceholder(selectedProvinceName) // Use the selected province's name
            .addOptions(itemOptions.length ? itemOptions : [{ label: province.noProvinces, value: 'none' }]); // Use noProvinces

        const row1 = new ActionRowBuilder().addComponents(itemSelect);
        const row2 = new ActionRowBuilder().addComponents(homeButton, prevButton, nextButton); // Added Home button

        return { components: [row1, row2], embeds: [pages[page]?.embed] };
    };

    const displayItemDetails = (index) => {
        const provinceData = Provinces[index];
        if (!provinceData) {
            console.error('Province not found at index:', index);
            return { embed: client.embed().setDescription(province.notFound).setColor(color.red) }; // Use notFound
        }

        const embed = client.embed()
            .setColor(color.main)
            .setTitle(`${province.detailTitle} : ${provinceData.name}`) // Use detailTitle
            .setDescription(`**${province.id} : ${provinceData.id}** \n**${province.description} : **\n${provinceData.description}`) // Use description
            .setImage(provinceData.image)
            .setFooter({
                text: `${province.requestBy} ${ctx.author.displayName}`, // Use requestBy
                iconURL: ctx.author.displayAvatarURL(),
            });

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
        time: 300000, // 5 minutes
    });

    collector.on('collect', async int => {
        if (ctx.author.id === int.user.id) {
            if (int.customId === 'home') {
                // Reset to the home screen
                selectedItemIndex = null; // Reset selection
                selectedProvinceName = province.selectProvince; // Reset placeholder
                page = 0; // Reset to first page
                await int.update({ ...getButtonRow(), embeds: [pages[page]?.embed] });
            } else if (int.customId === 'prev_item') {
                // Handle previous
                if (selectedItemIndex === null) {
                    // Select last item if no previous selection
                    selectedItemIndex = totalProvinces - 1;
                } else {
                    selectedItemIndex--;
                    if (selectedItemIndex < 0) selectedItemIndex = totalProvinces - 1; // Wrap to last
                }
                selectedProvinceName = Provinces[selectedItemIndex].name;
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            } else if (int.customId === 'next_item') {
                // Handle next
                if (selectedItemIndex === null) {
                    // Select first item if no next selection
                    selectedItemIndex = 0;
                } else {
                    selectedItemIndex++;
                    if (selectedItemIndex >= totalProvinces) selectedItemIndex = 0; // Wrap to first
                }
                selectedProvinceName = Provinces[selectedItemIndex].name;
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            } else if (int.customId === 'item_select') {
                // Handle dropdown selection
                selectedItemIndex = Provinces.findIndex(p => p.id === int.values[0]);
                if (selectedItemIndex !== -1) {
                    selectedProvinceName = Provinces[selectedItemIndex].name;
                    await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
                } else {
                    await int.update({
                        embeds: [
                            client.embed().setDescription(province.notFound).setColor(color.red) // Use notFound
                        ],
                        components: getButtonRow().components
                    });
                }
            }
        } else {
            await int.reply({ content: 'You cannot interact with this menu.', ephemeral: true });
        }
    });

    collector.on('end', () => {
        msg.edit({ components: [] });
    });
}

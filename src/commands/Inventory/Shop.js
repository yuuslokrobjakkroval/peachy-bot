const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../assets/inventory/Items.js'); // Import the emojis data

module.exports = class Shop extends Command {
    constructor(client) {
        super(client, {
            name: 'shop',
            description: {
                content: 'Displays the emoji shop with navigation and filtering options.',
                examples: ['shop', 'shop 2', 'shop food'],
                usage: 'shop [page] [category]',
            },
            category: 'economy',
            aliases: ['store'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args) {
        try {
            let page = parseInt(args[0]) || 1;
            let selectedCategory = args[1] || null;
            let selectedItem = args[2] || null;

            const itemsPerPage = 5;
            const categories = [...new Set(emojis.map(e => e.category))];
            let filteredItems = emojis;

            if (selectedCategory) {
                filteredItems = filteredItems.filter(e => e.category === selectedCategory);
            }

            if (selectedItem) {
                filteredItems = filteredItems.filter(e => e.name === selectedItem);
            }

            const totalItems = filteredItems.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = filteredItems.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle('<a:Dom:1264200823542517812> Emoji Shop <a:Dom:1264200823542517812>')
                .setColor(client.color.main)
                .setDescription('Browse and purchase your favorite emojis!')
                .setFooter({ text: `Page ${page} of ${totalPages}` })
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }));

            pageItems.forEach(item => {
                embed.addFields({ name: `${item.name} - ${item.price} coins`, value: item.emoji });
            });

            const selectCategories = new StringSelectMenuBuilder()
                .setCustomId('filter_category')
                .setPlaceholder('Select a category')
                .addOptions(categories.map(c => ({ label: c, value: c })));

            const limitedItems = emojis.slice(0, 25);
            const selectItems = new StringSelectMenuBuilder()
                .setCustomId('filter_item')
                .setPlaceholder('Select an item')
                .addOptions(limitedItems.map(i => ({ label: i.name, value: i.name })));

            const categoryRow = new ActionRowBuilder().addComponents(selectCategories);
            const itemRow = new ActionRowBuilder().addComponents(selectItems);

            const sentMessage = await ctx.sendMessage({ embeds: [embed], components: [categoryRow, itemRow] });

            const filter = i => i.user.id === ctx.author.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async interaction => {
                if (interaction.customId === 'filter_category') {
                    selectedCategory = interaction.values[0];
                    selectedItem = null; // Reset the item filter when a category is selected
                } else if (interaction.customId === 'filter_item') {
                    selectedItem = interaction.values[0];
                }

                page = 1;
                filteredItems = emojis;

                if (selectedCategory) {
                    filteredItems = filteredItems.filter(e => e.category === selectedCategory);
                }

                if (selectedItem) {
                    filteredItems = filteredItems.filter(e => e.name === selectedItem);
                }

                const updatedTotalItems = filteredItems.length;
                const updatedTotalPages = Math.ceil(updatedTotalItems / itemsPerPage);
                const updatedPageItems = filteredItems.slice(0, itemsPerPage);

                const updatedEmbed = new EmbedBuilder()
                    .setTitle('<a:Dom:1264200823542517812> Emoji Shop <a:Dom:1264200823542517812>')
                    .setColor(client.color.main)
                    .setDescription('Browse and purchase your favorite emojis!')
                    .setFooter({ text: `Page 1 of ${updatedTotalPages}` })
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }));

                updatedPageItems.forEach(item => {
                    updatedEmbed.addFields({ name: `${item.name} - ${item.price} coins`, value: item.emoji });
                });

                await interaction.update({ embeds: [updatedEmbed], components: [categoryRow, itemRow] });
            });

            await sentMessage.react('⬅️');
            await sentMessage.react('➡️');

            const reactionFilter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === ctx.author.id;
            const reactionCollector = sentMessage.createReactionCollector({ filter: reactionFilter, time: 60000 });

            reactionCollector.on('collect', async reaction => {
                if (reaction.emoji.name === '⬅️') {
                    if (page > 1) page--;
                } else if (reaction.emoji.name === '➡️') {
                    if (page < totalPages) page++;
                }

                const updatedStart = (page - 1) * itemsPerPage;
                const updatedEnd = updatedStart + itemsPerPage;
                const updatedPageItems = filteredItems.slice(updatedStart, updatedEnd);

                const updatedEmbed = new EmbedBuilder()
                    .setTitle(`<a:Dom:1264200823542517812> Emoji Shop <a:Dom:1264200823542517812>`)
                    .setColor(client.color.main)
                    .setDescription('Browse and purchase your favorite emojis!')
                    .setFooter({ text: `Page ${page} of ${totalPages}` })
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }));

                updatedPageItems.forEach(item => {
                    updatedEmbed.addFields({ name: `${item.name} - ${item.price} coins`, value: item.emoji });
                });

                await sentMessage.edit({ embeds: [updatedEmbed] });
                await reaction.users.remove(ctx.author.id);
            });

            reactionCollector.on('end', () => {
                sentMessage.reactions.removeAll();
            });
        } catch (error) {
            console.error('Error in Shop command:', error);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while fetching the shop.');
        }
    }
};

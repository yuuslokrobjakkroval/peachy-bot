const { Command } = require('../../structures');
const { MessageActionRow, MessageButton, MessageSelectMenu, MessageEmbed } = require('discord.js');
const Items = require('../../assets/inventory/Items');

module.exports = class Shop extends Command {
  constructor(client) {
    super(client, {
      name: 'shop',
      description: {
        content: 'Browse the shop with various items.',
        examples: ['shop'],
        usage: 'shop',
      },
      category: 'shop',
      aliases: ['store'],
      cooldown: 10,
      args: false,
      permissions: {
        dev: false,
        client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions'],
        user: [],
      },
      slashCommand: true,
    });

    this.itemsPerPage = 5; // Number of items to display per page
  }

  async run(client, ctx) {
    let page = 0; // Default page
    let categoryFilter = 'All'; // Default category filter
    let itemFilter = ''; // Default item filter

    const updateShop = async () => {
      const filteredItems = Items.filter(item =>
          (categoryFilter === 'All' || item.category === categoryFilter) &&
          (item.name.toLowerCase().includes(itemFilter.toLowerCase()))
      );

      const totalPages = Math.ceil(filteredItems.length / this.itemsPerPage);
      const itemsToShow = filteredItems.slice(page * this.itemsPerPage, (page + 1) * this.itemsPerPage);

      const embed = client.embed()
          .setTitle('Shop')
          .setDescription(itemsToShow.map(item => `${item.emoji} ${item.name} - $${item.price}`).join('\n') || 'No items found.')
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

      const row1 = new MessageActionRow()
          .addComponents(
              new MessageButton()
                  .setCustomId('previous')
                  .setLabel('Previous')
                  .setStyle('PRIMARY')
                  .setDisabled(page === 0)
          )
          .addComponents(
              new MessageButton()
                  .setCustomId('next')
                  .setLabel('Next')
                  .setStyle('PRIMARY')
                  .setDisabled(page >= totalPages - 1)
          );

      const row2 = new MessageActionRow()
          .addComponents(
              new MessageSelectMenu()
                  .setCustomId('category_filter')
                  .setPlaceholder('Select a category')
                  .addOptions([
                    { label: 'All', value: 'All' },
                    { label: 'Food', value: 'Food' },
                    { label: 'Drink', value: 'Drink' },
                    { label: 'Doll', value: 'Doll' }
                  ])
          )
          .addComponents(
              new MessageButton()
                  .setCustomId('reset_filter')
                  .setLabel('Reset Filter')
                  .setStyle('SECONDARY')
          );

      const message = await ctx.sendMessage({ embeds: [embed], components: [row1, row2] });

      const filter = interaction => interaction.user.id === ctx.author.id;

      const collector = message.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async interaction => {
        if (interaction.customId === 'previous') {
          page = Math.max(page - 1, 0);
        } else if (interaction.customId === 'next') {
          page = Math.min(page + 1, totalPages - 1);
        } else if (interaction.customId === 'category_filter') {
          categoryFilter = interaction.values[0];
          page = 0; // Reset to the first page
        } else if (interaction.customId === 'reset_filter') {
          categoryFilter = 'All';
          itemFilter = '';
          page = 0; // Reset to the first page
        }

        await updateShop();
        await interaction.update({ embeds: [embed], components: [row1, row2] });
      });

      collector.on('end', async collected => {
        await message.edit({ components: [] });
      });
    };

    await updateShop();
  }
};

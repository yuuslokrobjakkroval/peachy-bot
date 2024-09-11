const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const BretData = require('../../assets/json/bret.json');
const { emojiButton } = require('../../functions/function');

const bretNames = [...new Set(BretData.map(bret => bret.name))];

module.exports = class Bret extends Command {
    constructor(client) {
        super(client, {
            name: 'bret',
            description: {
                content: 'View and select BRETs.',
                examples: ['bret'],
                usage: 'bret',
            },
            cooldown: 5,
            category: 'fun',
            aliases: ['b', 'ប្រេត'],
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

    async run(client, ctx, args) {
        const bretOptions = bretNames.map(name => ({
            label: name,
            value: name,
        }));

        const embed = client.embed()
            .setColor(client.color.main)
            .setTitle('Select a BRET')
            .setDescription('Choose a BRET from the dropdown menu below.');

        const row1 = new ActionRowBuilder().addComponents(
            new SelectMenuBuilder()
                .setCustomId('bret_select')
                .setPlaceholder('Select a BRET')
                .addOptions(bretOptions)
        );

        const msg = ctx.isInteraction
            ? await ctx.interaction.reply({ embeds: [embed], components: [row1], fetchReply: true })
            : await ctx.channel.send({ embeds: [embed], components: [row1], fetchReply: true });

        const collector = msg.createMessageComponentCollector({
            filter: int => int.user.id === ctx.author.id,
            time: 300000,  // 5 minutes
        });

        collector.on('collect', async int => {
            if (int.customId === 'bret_select') {
                const selectedName = int.values[0];
                const selectedBret = BretData.find(bret => bret.name === selectedName);

                if (selectedBret) {
                    const detailEmbed = client.embed()
                        .setColor(client.color.main)
                        .setTitle(`អម្បូរ: ${selectedBret.name}`)
                        .setDescription(`**លេងរៀង : ** ${selectedBret.id}\n**ការពិពណ៌នា : **\n${selectedBret.description}`)
                        .setImage(selectedBret.image);

                    const prevButton = emojiButton('prev', '⬅️', 2);
                    const nextButton = emojiButton('next', '➡️', 2);

                    const detailRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

                    await int.update({ embeds: [detailEmbed], components: [detailRow] });

                    let page = 0;

                    const paginateDetails = () => {
                        const itemsPerPage = 1;  // Adjust if needed
                        const totalPages = Math.ceil(BretData.length / itemsPerPage);

                        const currentItems = BretData.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
                        const currentItem = currentItems[0];  // Only one item per page

                        const detailEmbed = client.embed()
                            .setColor(client.color.main)
                            .setTitle(`អម្បូរ: ${selectedBret.name}`)
                            .setDescription(`**លេងរៀង : ** ${selectedBret.id}\n**ការពិពណ៌នា : **\n${selectedBret.description}`)
                            .setImage(currentItem.image);

                        return { embeds: [detailEmbed], components: [detailRow] };
                    };

                    const pageCollector = msg.createMessageComponentCollector({
                        filter: int => int.user.id === ctx.author.id,
                        time: 300000,  // 5 minutes
                    });

                    pageCollector.on('collect', async int => {
                        if (int.customId === 'prev') {
                            page--;
                            if (page < 0) page = BretData.length - 1;
                            await int.update(paginateDetails());
                        } else if (int.customId === 'next') {
                            page++;
                            if (page >= BretData.length) page = 0;
                            await int.update(paginateDetails());
                        }
                    });

                    pageCollector.on('end', () => {
                        msg.edit({ components: [] });
                    });
                } else {
                    await int.update({ content: 'BRET not found.', components: [] });
                }
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    }
};

const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Animals = require('../../assets/json/animalOfYear.json'); // Your Animal JSON data
const { emojiButton } = require('../../functions/function');

module.exports = class AnimalOfYear extends Command {
    constructor(client) {
        super(client, {
            name: 'animalofyear',
            description: {
                content: 'View and select animals of the year.',
                examples: ['animalofyear'],
                usage: 'animalofyear',
            },
            cooldown: 5,
            category: 'fun',
            aliases: ['aoy', 'animal'],
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
        const selectedAnimals = Animals; // All animals

        const pages = [];
        const itemsPerPage = 12; // Adjust the number of animals per page
        const totalPages = Math.ceil(selectedAnimals.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const currentItems = selectedAnimals.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
            const animalList = currentItems.map((animal, index) => `**${animal.name}** ${animal.emoji}`).join('\n\n');

            const embed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} 𝐀𝐍𝐈𝐌𝐀𝐋𝐒 𝐎𝐅 𝐓𝐇𝐄 𝐘𝐄𝐀𝐑 ${emoji.mainRight}`)
                .setImage('https://image.freshnewsasia.com/2020/id-06/fn-2020-04-13-07-12-12-0.jpg') // Placeholder image, replace with your own if needed
                .setFooter({
                    text: `Request By ${ctx.author.displayName}`,
                    iconURL: ctx.author.displayAvatarURL(),
                });

            pages.push({ embed });
        }

        await paginateAnimals(client, ctx, color, emoji, pages);
    }
};

async function paginateAnimals(client, ctx, color, emoji, pages) {
    let page = 0;
    let selectedItemIndex = null;
    let selectedAnimalName = 'Select an animal';
    const totalAnimals = Animals.length;

    const getButtonRow = () => {
        const homeButton = emojiButton('home', '🏠', 2); // Home button
        const prevButton = emojiButton('prev_item', '⬅️', 2);
        const nextButton = emojiButton('next_item', '➡️', 2);

        const itemOptions = Animals.map(item => ({
            label: item.name,
            value: item.id,
        }));

        const itemSelect = new StringSelectMenuBuilder()
            .setCustomId('item_select')
            .setPlaceholder(selectedAnimalName) // Use the selected animal's name
            .addOptions(itemOptions.length ? itemOptions : [{ label: 'No animals available', value: 'none' }]);

        const row1 = new ActionRowBuilder().addComponents(itemSelect);
        const row2 = new ActionRowBuilder().addComponents(homeButton, prevButton, nextButton); // Added Home button

        return { components: [row1, row2], embeds: [pages[page]?.embed] };
    };

    const displayItemDetails = (index) => {
        const animal = Animals[index];
        if (!animal) {
            console.error('Animal not found at index:', index);
            return { embed: client.embed().setDescription('Animal not found.').setColor(color.red) };
        }

        const embed = client.embed()
            .setColor(color.main)
            .setTitle(`𝐀𝐍𝐈𝐌𝐀𝐋 𝐃𝐄𝐓𝐀𝐈𝐋 : ${animal.name}`)
            .setThumbnail(client.utils.emojiToImage(animal.emoji))
            .setDescription(`**ID : ${animal.id}** \n**Description : **\n${animal.description}`)
            .setFooter({
                text: `Request By ${ctx.author.displayName}`,
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
        time: 300000,
    });

    collector.on('collect', async int => {
        if (ctx.author.id === int.user.id) {
            if (int.customId === 'home') {
                selectedItemIndex = null;
                selectedAnimalName = 'Select an animal';
                page = 0;
                await int.update({ ...getButtonRow(), embeds: [pages[page]?.embed] });
            } else if (int.customId === 'prev_item') {
                if (selectedItemIndex === null) {
                    selectedItemIndex = totalAnimals - 1;
                } else {
                    selectedItemIndex--;
                    if (selectedItemIndex < 0) selectedItemIndex = totalAnimals - 1;
                }
                selectedAnimalName = Animals[selectedItemIndex].name;
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            } else if (int.customId === 'next_item') {
                if (selectedItemIndex === null) {
                    selectedItemIndex = 0;
                } else {
                    selectedItemIndex++;
                    if (selectedItemIndex >= totalAnimals) selectedItemIndex = 0;
                }
                selectedAnimalName = Animals[selectedItemIndex].name;
                await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
            } else if (int.customId === 'item_select') {
                selectedItemIndex = Animals.findIndex(a => a.id === int.values[0]);
                if (selectedItemIndex !== -1) {
                    selectedAnimalName = Animals[selectedItemIndex].name;
                    await int.update({ embeds: [displayItemDetails(selectedItemIndex).embed], components: getButtonRow().components });
                } else {
                    await int.update({ embeds: [client.embed().setDescription('Animal not found.').setColor(color.red)], components: getButtonRow().components });
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

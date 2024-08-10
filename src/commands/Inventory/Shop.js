const { Command } = require("../../structures/index.js");
const shopItems = require("../../data/shop.json");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class Shop extends Command {
    constructor(client) {
        super(client, {
            name: "shop",
            description: {
                content: "View items available in the shop",
                examples: ["shop"],
                usage: "shop",
            },
            category: "inventory",
            aliases: ["shop"],
            cooldown: 3,
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

    async run(client, ctx, args) {
        // Create an embed for the shop items
        let embed = this.client.embed();
        embed.setAuthor({
            name: this.client.user.username,
            iconURL: this.client.user.displayAvatarURL(),
        }).setColor(this.client.color.main)
            .setDescription('Here are the items available for purchase:');

        // Add fields for each item
        shopItems.forEach(item => {
            embed.addFields({
                name: item.name,
                value: `${item.description}\nPrice: ${item.price}`,
                inline: false,
            })
                .setImage(item.imageUrl);  // Set the image for the item
        });

        // Create action rows with buttons for each item
        const actionRows = [];
        shopItems.forEach(item => {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_${item.id}`)
                        .setLabel('Buy')
                        .setStyle(ButtonStyle.Primary)
                );
            actionRows.push(row);
        });

        // Send the embed and buttons
        return await ctx.sendMessage({
            embeds: [embed],
            components: actionRows,
        });
    }
}

module.exports = Shop;

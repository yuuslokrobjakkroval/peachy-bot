const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Users = require('../../schemas/user');
const ImportantItems = require('../../assets/inventory/ImportantItems.js')
const ShopItems = require('../../assets/inventory/ShopItems.js')
const AllItems = ShopItems.flatMap(shop => shop.inventory);

module.exports = class GiveItem extends Command {
    constructor(client) {
        super(client, {
            name: 'giveitem',
            description: {
                content: 'Give your item to another user.',
                examples: ['giveitem @user gem 1', 'gi @user gem 1'],
                usage: 'give <user> <item> <amount>, gi <user> <item> <amount>',
            },
            category: 'inventory',
            aliases: ['gi'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'user',
                    description: 'The user you want to give to.',
                    type: 6,
                    required: true,
                },
                {
                    name: 'item',
                    description: 'The item you want to give.',
                    type: 3,
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount you want to give.',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const authorId = ctx.author.id;
        const user = await Users.findOne({ userId: authorId });

        if (!user || user.inventory.length === 0) {
            return await client.utils.sendErrorMessage(client, ctx, 'Your inventory is empty.', color);
        }

        const target = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || ctx.member;
        const isBot = target ? (ctx.isInteraction ? target.bot : target.user.bot) : false;
        if (!target || isBot || target.id === authorId) {
            let errorMessage = '';
            if (!target) errorMessage += client.i18n.get(language, 'commands', 'no_user');
            else if (isBot) errorMessage += client.i18n.get(language, 'commands', 'mention_to_bot');
            else if (target.id === authorId) errorMessage += client.i18n.get(language, 'commands', 'mention_to_self');
            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        const itemId = ctx.isInteraction ? ctx.interaction.options.data[1]?.value.toString() : args[1];
        const itemInfo = AllItems.concat(ImportantItems).find(({ id }) => id === itemId.toLowerCase());
        const hasItems = user.inventory.find(item => item.id === itemId);
        if (!itemInfo || !hasItems || !itemInfo.able.gift) {
            let errorMessage = '';

            if (!itemInfo) errorMessage += `The item with id \`${args.join(' ')}\` couldn't be found!`;
            if (!hasItems)
                errorMessage += `You don't have ${itemInfo.emoji} **${client.utils.toNameCase(itemInfo.id)}** in your inventory.`;
            if (!itemInfo.able.gift)
                errorMessage += `The item ${itemInfo.emoji} **${client.utils.toNameCase(itemInfo.id)}** is not giveable!`;
            return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
        }

        let amount = ctx.isInteraction ? ctx.interaction.options.data[2]?.value || 1 : args[2] || 1;
        if (isNaN(amount) || amount <= 0 || amount.toString().includes('.') || amount.toString().includes(',')) {
            const amountMap = { all: hasItems.quantity, half: Math.ceil(hasItems.quantity / 2) };
            if (amount in amountMap) amount = amountMap[amount];
            else {
                return await ctx.sendMessage({
                    embeds: [
                        client.embed().setColor(color.red).setDescription(client.i18n.get(language, 'commands', 'invalid_amount')),
                    ],
                });
            }
        }

        const itemAmount = parseInt(Math.min(amount, hasItems.quantity));

        const embed = client
            .embed()
            .setColor(color.main)
            .setTitle(`Give Item - ${ctx.author.displayName}`)
            .setDescription(`${ctx.author.displayName}, select **Accept** to proceed with the transaction or **Cancel** to decline.`)
            .addFields([
                {
                    name: `Sent item`,
                    value: `${itemInfo.emoji} **\`${itemAmount.toLocaleString()}\`** ${itemInfo.name}`,
                    inline: true,
                },
                {
                    name: `Received item`,
                    value: `${itemInfo.emoji} **\`${itemAmount.toLocaleString()}\`** ${itemInfo.name}`,
                    inline: true,
                },
            ]);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${this.name}_accept`).setLabel('Accept').setStyle(3),
            new ButtonBuilder().setCustomId(`${this.name}_cancel`).setLabel('Cancel').setStyle(4)
        );

        const msg = ctx.isInteraction
            ? ctx.deferred
                ? await ctx.interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
                : await ctx.interaction.reply({ embeds: [embed], components: [row], fetchReply: true })
            : await ctx.channel.send({ embeds: [embed], components: [row], fetchReply: true });

        const filter = interaction => interaction.user.id === ctx.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 120000, idle: 60000 });

        collector.on('end', async () => {
            await msg.edit({ components: [new ActionRowBuilder().addComponents(row.components.map(c => c.setDisabled(true)))] });
        });

        collector.on('collect', async int => {
            await int.deferUpdate();

            if (int.customId === `${this.name}_accept`) {
                const user = await Users.findOne({ userId: authorId });
                let targetUser = await Users.findOne({ userId: target.id });

                if (!user || user.inventory.length === 0) {
                    return await client.utils.sendErrorMessage(client, ctx, 'Your inventory is empty.', color);
                }

                if(!targetUser) {
                    await Users.create({
                        userId: target.id,
                    });
                }

                const itemInfo = AllItems.concat(ImportantItems).find(({ id }) => id === itemId.toLowerCase());
                const hasItems = user.inventory.find(item => item.id === itemId);
                if (!itemInfo || !hasItems || !itemInfo.able.gift) {
                    let errorMessage = '';

                    if (!itemInfo) errorMessage += `The item with id \`${args.join(' ')}\` couldn't be found!`;
                    if (!hasItems)
                        errorMessage += `You don't have ${itemInfo.emoji} **${client.utils.toNameCase(itemInfo.id)}** in your inventory.`;
                    if (!itemInfo.able.gift)
                        errorMessage += `The item ${itemInfo.emoji} **${client.utils.toNameCase(itemInfo.id)}** is not giveable!`;
                    return await client.utils.sendErrorMessage(client, ctx, errorMessage, color);
                }

                const itemAmount = parseInt(Math.min(amount, hasItems.quantity));

                // Remove the item or reduce quantity for the author
                if (hasItems.quantity - itemAmount === 0) {
                    await Users.updateOne(
                        { userId: authorId },
                        { $pull: { inventory: { id: itemId } } }
                    );
                } else {
                    await Users.updateOne(
                        { userId: authorId, 'inventory.id': itemId },
                        { $inc: { 'inventory.$.quantity': -itemAmount } }
                    );
                }

                const targetHasItem = targetUser.inventory.find(item => item.id === itemId);
                if (targetHasItem) {
                    await Users.updateOne(
                        { userId: target.id, 'inventory.id': itemId },
                        { $inc: { 'inventory.$.quantity': itemAmount } }
                    );
                } else {
                    await Users.updateOne(
                        { userId: target.id },
                        { $push: { inventory: { id: itemId, quantity: itemAmount } } }
                    );
                }

                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(
                        `You have accepted the transaction. ${itemInfo.emoji} **\`x${itemAmount}\`** ${itemInfo.name} has been transferred to **${target.displayName}**.`
                    );

                await int.editReply({ embeds: [embed], components: [] });
            } else if (int.customId === `${this.name}_cancel`) {
                const embed = client
                    .embed()
                    .setColor(color.main)
                    .setDescription(`You have canceled the transaction. No items have been transferred.`);

                await int.editReply({ embeds: [embed], components: [] });
            }
        });
    }
};

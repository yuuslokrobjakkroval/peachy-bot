const { Command } = require('../../structures/index.js');
const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js');
const GiveawayShopItemSchema = require('../../schemas/giveawayShopItem.js');
const importantItems = require('../../assets/inventory/ImportantItems.js');
const shopItems = require('../../assets/inventory/ShopItems.js');
const items = shopItems.flatMap(shop => shop.inventory);
const ms = require('ms');

module.exports = class GiveawayShopItem extends Command {
    constructor(client) {
        super(client, {
            name: 'giveawayshopitem',
            description: {
                content: 'Start a shop item giveaway for food, drink, or themes, milk in the shop.',
                examples: ['giveawayshopitem 1h 1 food f01 5 true', 'giveawayshopitem 2h 3 drink d01 false @User #channel'],
                usage: 'giveawayshopitem <duration> <winners> <type> <itemID> <amount> <image> <thumbnail> <autoadd> [host] [channel]',
            },
            category: 'giveaway',
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                { name: 'duration', description: 'Duration of the giveaway.', type: 3, required: true },
                { name: 'winners', description: 'Number of winners.', type: 4, required: true },
                { name: 'type', description: 'The giveaway type (food, drink, theme, milk).', type: 3, required: true },
                { name: 'itemid', description: 'The item ID from the shop.', type: 3, required: true },
                { name: 'amount', description: 'The amount of items to give away.', type: 4, required: true },
                { name: 'image', description: 'Image URL for the giveaway.', type: 3, required: false },
                { name: 'thumbnail', description: 'Thumbnail URL for the giveaway.', type: 3, required: false },
                { name: 'autoadd', description: 'Automatically add item winners (true/false).', type: 3, required: false },
                { name: 'host', description: 'Specify the giveaway host (mention or user ID).', type: 6, required: false },
                { name: 'channel', description: 'Specify the channel to post the giveaway.', type: 7, required: false },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        if (ctx.isInteraction) {
            await ctx.interaction.deferReply({ephemeral: true});
        }

        const member = await ctx.guild.members.fetch(ctx.author.id);
        const isOwner = this.client.config.owners.includes(ctx.author.id);
        const isServerOwner = this.client.config.serverOwner.includes(ctx.author.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isOwner && !isServerOwner && !isAdmin) {
            return (ctx.isInteraction
                    ? ctx.interaction.reply({
                        content: 'Only the bot owner, server owner, and administrators can use this giveaway.',
                        ephemeral: true
                    })
                    : ctx.sendMessage({
                        content: 'Only the bot owner, server owner, and administrators can use this giveaway.',
                        ephemeral: true
                    })
            );
        }

        const durationStr = ctx.isInteraction ? ctx.interaction.options.getString('duration') : args[0];
        const winnersStr = ctx.isInteraction ? ctx.interaction.options.getInteger('winners') : args[1];
        const type = ctx.isInteraction ? ctx.interaction.options.getString('type') : args[2];
        const itemID = ctx.isInteraction ? ctx.interaction.options.getString('itemid') : args[3];
        const amount = ctx.isInteraction ? ctx.interaction.options.getInteger('amount') : args[4];
        const image = ctx.isInteraction ? ctx.interaction.options.getString('image') : args[5];
        const thumbnail = ctx.isInteraction ? ctx.interaction.options.getString('thumbnail') : args[6];
        const autoAdd = ctx.isInteraction ? ctx.interaction.options.getString('autoadd') : args[7];

        if (autoAdd && !isOwner) {
            return (ctx.isInteraction
                    ? ctx.interaction.reply({
                        content: 'Only the bot owner can enable auto add for giveaways.',
                        ephemeral: true
                    })
                    : ctx.sendMessage({
                        content: 'Only the bot owner can enable auto add for giveaways.',
                        ephemeral: true
                    })
            );
        }

        const host = ctx.isInteraction ? ctx.interaction.options.getUser('host') : args[8];
        const channel = ctx.isInteraction ? ctx.interaction.options.getChannel('channel') : args[9];

        const category = items.concat(importantItems).filter(c => c.type === type);
        if (!category) return ctx.sendMessage({ content: 'Invalid item type specified.' });

        const item = category.find(i => i.id.toLowerCase() === itemID.toLowerCase());
        if (!item) return ctx.sendMessage({ content: `No item found with ID ${itemID} in category ${type}.` });

        const duration = ms(durationStr);
        const winners = parseInt(winnersStr, 10);

        // Validate inputs
        if (!duration || isNaN(winners) || winners <= 0 || !itemID || amount <= 0) {
            const replyMessage = {
                embeds: [
                    client.embed()
                        .setAuthor({ name: client.user.displayName, iconURL: client.user.displayAvatarURL() })
                        .setColor(color.red)
                        .setDescription('Invalid input. Please ensure the duration, number of winners, amount, and prize are correctly provided.'),
                ],
            };
            if (ctx.isInteraction) {
                await ctx.interaction.reply(replyMessage);
            } else {
                await ctx.sendMessage(replyMessage);
            }
            return;
        }

        const endTime = Date.now() + duration;
        const formattedDuration = Math.floor(endTime / 1000);

        const giveawayEmbed = client.embed()
            .setColor(color.main)
            .setTitle(`**ID: \`${item.id}\`\n${item.name} ${client.utils.formatNumber(amount)}** ${item.emoji}`)
            .setDescription(
                `Click ${emoji.main} button to enter!\nWinners: ${winners}\nHosted by: ${host ? host.displayName : ctx.author.displayName}\nEnds: <t:${formattedDuration}:R>`
            );

        if (image) giveawayEmbed.setImage(image);
        if (thumbnail) giveawayEmbed.setThumbnail(thumbnail);

        const joinButton = new ButtonBuilder()
            .setCustomId('giveawayshopitem-join')
            .setEmoji(`${emoji.main}`)
            .setLabel('0')
            .setStyle(1)
            .setDisabled(false);

        const participantsButton = new ButtonBuilder()
            .setCustomId('giveawayshopitem-participants')
            .setLabel('Participants')
            .setStyle(2)
            .setDisabled(false);

        const buttonRow = new ActionRowBuilder().addComponents(joinButton, participantsButton);

        let giveawayMessage;
        try {
            giveawayMessage = await (channel || ctx.channel).send({
                embeds: [giveawayEmbed],
                components: [buttonRow],
                fetchReply: true,
            });
        } catch (err) {
            console.error(err);
            const response = 'There was an error sending the giveaway message.';
            return ctx.isInteraction
                ? ctx.editReply({ content: response })
                : ctx.sendMessage({ content: response });
        }

        if (ctx.isInteraction) {
            await ctx.interaction.editReply({ content: 'Giveaway successfully created!' });
        } else {
            ctx.sendMessage({ content: 'Giveaway successfully created!', ephemeral: true });
        }

        await GiveawayShopItemSchema.create({
            guildId: ctx.guild.id,
            channelId: channel ? channel.id : ctx.channel.id,
            messageId: giveawayMessage.id,
            hostedBy: host ? host.id : ctx.author.id,
            winners: winners,
            itemId: item.id,
            type: type,
            amount: amount,
            endTime: Date.now() + duration,
            paused: false,
            ended: false,
            entered: [],
            autoAdd: !!autoAdd,
            retryAutopay: false,
            winnerId: [],
            rerollOptions: [],
        });
    }
};

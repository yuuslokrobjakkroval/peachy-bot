const { Command } = require('../../structures/index.js');
const { PermissionsBitField } = require("discord.js");
const globalConfig = require("../../utils/Config");
const GiveawaySchema = require('../../schemas/giveaway');
const GiveawayShopItemSchema = require('../../schemas/giveawayShopItem');
const importantItems = require('../../assets/inventory/ImportantItems');
const shopItems = require('../../assets/inventory/ShopItems');
const items = shopItems.flatMap(shop => shop.inventory);

module.exports = class Reroll extends Command {
    constructor(client) {
        super(client, {
            name: 'reroll',
            description: 'Reroll the giveaway to pick new winners.',
            category: 'giveaway',
            aliases: [],
            args: true,
            permissions: {
                dev: false,
                client: ['SendMessages', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'messageid',
                    description: 'The message ID of the giveaway to reroll.',
                    type: 3,
                    required: true, // Make it optional for flexibility
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const member = await ctx.guild.members.fetch(ctx.author.id);
        const isOwner = globalConfig.owners.includes(ctx.author.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isOwner && !isAdmin) {
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

        const messageId = ctx.isInteraction ? ctx.interaction.options.getString('messageid') : args[0];
        if (!messageId) {
            return ctx.sendMessage({ content: 'Please provide a message ID for the giveaway to reroll.' });
        }

        const giveaway = await GiveawaySchema.findOne({ messageId }) || await GiveawayShopItemSchema.findOne({ messageId });

        if (!giveaway) {
            return ctx.sendMessage({ content: 'No giveaway found with the provided message ID.' });
        }

        if (!giveaway.ended) {
            return ctx.sendMessage({ content: 'This giveaway has not ended yet, so it cannot be rerolled.' });
        }

        if (giveaway.retryAutopay) {
            return ctx.sendMessage({ content: 'This giveaway has retry autopay enabled and cannot be rerolled.' });
        }

        // Select new winners
        const newWinners = this.selectNewWinners(giveaway.entered, giveaway.winners, giveaway.winnerId);
        if (newWinners.length === 0) {
            return ctx.sendMessage({ content: 'No eligible participants left to reroll.' });
        }

        // Update giveaway with new winners
        giveaway.winnerId = newWinners;
        giveaway.rerollCount += 1;
        giveaway.rerolledWinners.push(...newWinners);
        await giveaway.save();

        // Determine if giveaway is for currency or a shop item
        if (giveaway instanceof GiveawaySchema) {
            // If giveaway is from GiveawaySchema, handle currency prize
            const rerollEmbed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} Congratulations ${emoji.mainRight}`)
                .setDescription(
                    newWinners.length
                        ? `${newWinners.map(id => `<@${id}>`).join(', ')}! You have won **${client.utils.formatNumber(giveaway.prize)}** ${emoji.coin} ${emoji.congratulation}` +
                        `\n\nto reroll the giveaway again, please use\n\`${globalConfig.prefix.toLowerCase()}reroll ${messageId}\``
                        : `No one entered the giveaway for **\`${client.utils.formatNumber(giveaway.prize)}\`**!`
                )
                .setFooter({ text: `Rerolled by ${ctx.author.displayName}`, iconURL: ctx.author.displayAvatarURL() })
                .setTimestamp();

            return ctx.sendMessage({ embeds: [rerollEmbed] });
        } else if (giveaway instanceof GiveawayShopItemSchema) {
            // If giveaway is from GiveawayShopItemSchema, handle item prize
            const category = items.concat(importantItems).filter(c => c.type === giveaway.type);
            if (!category) {
                console.error(`Invalid item type specified for giveaway.`);
                return;
            }

            const itemInfo = category.find(i => i.id.toLowerCase() === giveaway.itemId.toLowerCase());
            if (!itemInfo) {
                console.error(`No item found with ID ${giveaway.itemId} in category ${giveaway.type}.`);
                return;
            }

            const rerollEmbed = client.embed()
                .setColor(color.main)
                .setTitle(`${emoji.mainLeft} Congratulations ${emoji.mainRight}`)
                .setDescription(
                    newWinners.length
                        ? `# Congratulations ${emoji.congratulation}` +
                        `${newWinners.map(user => `<@${user}>`).join(', ')}! You have won **${itemInfo.name} \`${client.utils.formatNumber(giveaway.amount)}\`**` +
                        `\n\nto reroll the giveaway, please use\n\`${globalConfig.prefix.toLowerCase()}reroll item ${messageId}\``
                        : `No one entered the giveaway for ${itemInfo.name} **\`${client.utils.formatNumber(giveaway.amount)}\`** ${itemInfo.emoji}!`
                )
                .setFooter({ text: `Rerolled by ${ctx.author.displayName}`, iconURL: ctx.author.displayAvatarURL() })
                .setTimestamp();

            return ctx.sendMessage({ embeds: [rerollEmbed] });
        }
    }

    selectNewWinners(entered, winnersCount, previousWinners) {
        const available = entered.filter(id => !previousWinners.includes(id));
        const newWinners = [];
        while (newWinners.length < winnersCount && available.length > 0) {
            const index = Math.floor(Math.random() * available.length);
            newWinners.push(...available.splice(index, 1));
        }
        return newWinners;
    }
};

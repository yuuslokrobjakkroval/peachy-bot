const { Command } = require('../../structures/index.js');
const { PermissionsBitField } = require("discord.js");
const GiveawaySchema = require('../../schemas/giveaway.js');

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
                    required: false, // Make it optional for flexibility
                },
            ],
        });
    }

    async run(client, ctx, args, color) {
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

        const messageId = ctx.isInteraction ? ctx.interaction.options.getString('messageid') : args[0];
        if (!messageId) {
            return ctx.sendMessage({ content: 'Please provide a message ID for the giveaway to reroll.' });
        }

        const giveaway = await GiveawaySchema.findOne({ messageId });

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

        // Embed for reroll results
        const rerollEmbed = client.embed()
            .setColor(color.main)
            .setTitle('🎉 Giveaway Rerolled! 🎉')
            .setDescription(`Here are the new winners for the giveaway:`)
            .addFields([
                { name: 'New Winners', value: newWinners.map(id => `<@${id}>`).join(', '), inline: true },
                { name: 'Prize', value: `${giveaway.prize} coins`, inline: true },
                { name: 'Number of Rerolls', value: `${giveaway.rerollCount}`, inline: true }
            ])
            .setFooter({ text: `Rerolled by ${ctx.author.displayName}`, iconURL: ctx.author.displayAvatarURL() })
            .setTimestamp();

        // Send embed with reroll results
        return ctx.sendMessage({ embeds: [rerollEmbed] });
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

const { Command } = require('../../structures/index.js');
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
        });
    }

    async run(client, ctx, args, color) {
        const isOwner = this.client.config.owners.includes(ctx.author.id);
        const isServerOwner = this.client.config.serverOwner.includes(ctx.author.id);

        // Check if user is an owner
        if (!isOwner && !isServerOwner) {
            return (ctx.isInteraction
                    ? ctx.interaction.reply({
                        content: 'Only the bot owner and server owner can enable autopay for giveaways.',
                        ephemeral: true
                    })
                    : ctx.sendMessage({
                        content: 'Only the bot owner and server owner can enable autopay for giveaways.',
                        ephemeral: true
                    })
            );
        }

        const messageId = args[0]; // Identify the giveaway by message ID
        const giveaway = await GiveawaySchema.findOne({ messageId });

        if (!giveaway) {
            return ctx.reply({ content: 'No giveaway found with the provided message ID.' });
        }

        if (giveaway.ended === false) {
            return ctx.reply({ content: 'This giveaway has not ended yet, so it cannot be rerolled.' });
        }

        if (giveaway.retryAutopay) {
            return ctx.reply({ content: 'This giveaway has retry autopay enabled and cannot be rerolled.' });
        }

        // Select new winners
        const newWinners = this.selectNewWinners(giveaway.entered, giveaway.winners, giveaway.winnerId);
        if (newWinners.length === 0) {
            return ctx.reply({ content: 'No eligible participants left to reroll.' });
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
        // Select new winners, avoiding previous winners
        const available = entered.filter(id => !previousWinners.includes(id));
        const newWinners = [];
        while (newWinners.length < winnersCount && available.length > 0) {
            const index = Math.floor(Math.random() * available.length);
            newWinners.push(...available.splice(index, 1));
        }
        return newWinners;
    }
};

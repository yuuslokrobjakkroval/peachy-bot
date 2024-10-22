const { Command } = require('../../structures/index.js');
const GiveawaySchema = require('../../schemas/giveaway.js');

module.exports = class ReAutopay extends Command {
    constructor(client) {
        super(client, {
            name: 'reautopay',
            description: {
                content: 'Re-attempt autopay for a specific giveaway using the message ID.',
                examples: ['reautopay <messageId>'],
                usage: 'reautopay <messageId>',
            },
            category: 'developer',
            aliases: ['retryautopay', 'ra'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'messageid',
                    description: 'The message ID of the giveaway to retry autopay for.',
                    type: 3, // String type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const messageId = ctx.isInteraction ? ctx.interaction.options.getString('messageid') : args[0];

        if (!messageId) {
            return await this.sendReply(ctx, {
                embeds: [
                    client.embed().setColor(color.red)
                        .setDescription('Please provide a valid giveaway message ID.'),
                ],
            });
        }

        try {
            const giveaway = await GiveawaySchema.findOne({ messageId: messageId });

            if (!giveaway) {
                return await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.red)
                            .setDescription(`No giveaway found with message ID: ${messageId}`),
                    ],
                });
            } else if (giveaway.retryAutopay) {
                const message = await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.red)
                            .setDescription(`the giveaway ${messageId} have paid already.`),
                    ],
                });


                setTimeout(() => {
                    message.delete().catch(err => console.error('Failed to delete message:', err));
                }, 5000); // 5000 milliseconds = 5 seconds

                return;

            }

            const winners = giveaway.winnerId.length === 0 ? giveaway.entered : giveaway.winnerId;

            if (!winners.length) {
                return await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.red)
                            .setDescription('No winners found for this giveaway.'),
                    ],
                });
            }

            // If retryAutopay is false, process the payment for each winner
            for (const winnerId of winners) {
                try {
                    await client.utils.addCoinsToUser(winnerId, giveaway.prize);
                    await this.sendReply(ctx, {
                        embeds: [
                            client.embed().setColor(color.main)
                                .setDescription(`**${client.user.username}** has given **\`${client.utils.formatNumber(giveaway.prize)}\`** ${emoji.coin} to <@${winnerId}>.`),
                        ],
                    });
                } catch (error) {
                    console.error(`Failed autopay for user ${winnerId}:`, error);
                    await ctx.channel.send(`⚠️ Failed to autopay for user <@${winnerId}>.`);
                }
            }
            giveaway.retryAutopay = true;
            await giveaway.save();


        } catch (err) {
            console.error(err);
            await this.sendReply(ctx, {
                embeds: [
                    client.embed().setColor(color.red)
                        .setDescription('An error occurred while reprocessing the autopay.'),
                ],
            });
        }
    }

    // Helper function to handle both interaction and non-interaction replies
    async sendReply(ctx, message) {
        if (ctx.isInteraction) {
            if (!ctx.replied) {
                await ctx.interaction.reply(message);
            } else {
                await ctx.interaction.followUp(message);
            }
        } else if (ctx.message) {
            await ctx.message.channel.send(message);
        } else {
            console.error('Unable to send reply: no valid context.');
        }
    }
};

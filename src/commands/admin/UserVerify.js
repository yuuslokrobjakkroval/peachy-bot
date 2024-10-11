const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user.js');

module.exports = class UpdatePaymentStatus extends Command {
    constructor(client) {
        super(client, {
            name: 'updatepayment',
            description: {
                content: 'Update a user\'s verification payment status or reset the verification.',
                examples: ['updatepayment <userId> <paid|unpaid>', 'updatepayment <userId> reset'],
                usage: 'updatepayment <userId> <paid|unpaid|reset>',
            },
            category: 'developer',
            aliases: ['uppay', 'setpay'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'userid',
                    description: 'The Discord user ID of the user to update.',
                    type: 3, // String type
                    required: true,
                },
                {
                    name: 'status',
                    description: 'The new payment status, either "paid", "unpaid", or "reset".',
                    type: 3, // String type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const userId = ctx.isInteraction ? ctx.interaction.options.getString('userid') : args[0];
        const status = ctx.isInteraction ? ctx.interaction.options.getString('status') : args[1];

        if (!userId || !status || !['paid', 'unpaid', 'reset'].includes(status.toLowerCase())) {
            return await this.sendReply(ctx, {
                embeds: [
                    client.embed().setColor(color.red)
                        .setDescription('Please provide a valid user ID and payment status ("paid", "unpaid", or "reset").'),
                ],
            });
        }

        try {
            // Find the user by the provided userId
            const user = await Users.findOne({ userId: userId });

            if (!user) {
                return await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.red)
                            .setDescription(`No user found with ID: ${userId}`),
                    ],
                });
            }

            // Check if we need to reset the verification
            if (status.toLowerCase() === 'reset') {
                user.verification.verify = {
                    payment: 'unpaid', // or any default value you want
                    status: 'unverified', // reset status if necessary
                    code: null,
                    message: null
                };
                await user.save();

                return await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.green)
                            .setDescription(`Successfully reset verification for user <@${userId}>.`),
                    ],
                });
            }

            // Update the user's verification payment status
            user.verification.verify.payment = status.toLowerCase();
            await user.save();

            return await this.sendReply(ctx, {
                embeds: [
                    client.embed().setColor(color.green)
                        .setDescription(`Successfully updated payment status to **${status}** for user <@${userId}>.`),
                ],
            });

        } catch (err) {
            console.error(err);
            await this.sendReply(ctx, {
                embeds: [
                    client.embed().setColor(color.red)
                        .setDescription('An error occurred while updating the payment status.'),
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

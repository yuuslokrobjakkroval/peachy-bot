const { Command } = require('../../structures/index.js');
const Users = require('../../schemas/user');

module.exports = class UpdatePaymentStatus extends Command {
    constructor(client) {
        super(client, {
            name: 'userverify',
            description: {
                content: "Update a user's verification",
                examples: ['userverify @user paid', 'userverify <userId> reset'],
                usage: 'userverify <userId> <paid|unpaid|reset|clear>',
            },
            category: 'staff',
            aliases: ['uv'],
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [
                {
                    name: 'userid',
                    description: 'The Discord user ID of the user to update.',
                    type: 3, // String type
                    required: true,
                },
                {
                    name: 'status',
                    description: 'The new payment status, either "paid", "unpaid", "reset", or "clear".',
                    type: 3, // String type
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[0]) || args[0];

        const userId = typeof mention === 'string' ? mention : mention.id;
        const syncUser = await client.users.fetch(userId);
        const status = ctx.isInteraction ? ctx.interaction.options.getString('status') : args[1];

        if (!userId || !status || !['paid', 'unpaid', 'reset', 'clear'].includes(status.toLowerCase())) {
            return await this.sendReply(ctx, {
                embeds: [
                    client
                        .embed()
                        .setColor(color.danger)
                        .setDescription('Please provide a valid user ID and payment status ("paid", "unpaid", or "reset").'),
                ],
            });
        }

        try {
            // Find the user by the provided userId
            const user = await Users.findOne({ userId: syncUser.id });

            if (!user) {
                return await this.sendReply(ctx, {
                    embeds: [client.embed().setColor(color.danger).setDescription(`No user found with ID: ${userId}`)],
                });
            }

            // Check if we need to reset the verification
            if (status.toLowerCase() === 'reset') {
                user.verification.verify = {
                    payment: 'paid',
                    status: 'unverified',
                    code: null,
                    message: null,
                };
                await user.save();

                return await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.success).setDescription(`Successfully reset verification for user <@${userId}>.`),
                    ],
                });
            }

            if (status.toLowerCase() === 'clear') {
                user.verification.verify = {
                    payment: 'unpaid',
                    status: 'unverified',
                    code: null,
                    message: null,
                };
                await user.save();

                return await this.sendReply(ctx, {
                    embeds: [
                        client.embed().setColor(color.success).setDescription(`Successfully clear verification for user <@${userId}>.`),
                    ],
                });
            }

            // Update the user's verification payment status
            user.verification.verify.payment = status.toLowerCase();
            await user.save();

            return await this.sendReply(ctx, {
                embeds: [
                    client
                        .embed()
                        .setColor(color.success)
                        .setDescription(
                            `Successfully updated payment status to **${client.utils.formatCapitalize(status)}** for user <@${userId}>.`
                        ),
                ],
            });
        } catch (err) {
            console.error(err);
            await this.sendReply(ctx, {
                embeds: [client.embed().setColor(color.danger).setDescription('An error occurred while updating the payment status.')],
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

const { Command } = require('../../structures/index.js');
const { EmbedBuilder, ChannelType } = require('discord.js');
const NukeRequest = require('../../schemas/nukeRequest.js');

module.exports = class NukeRequest extends Command {
    constructor(client) {
        super(client, {
            name: 'nukerequest',
            description: {
                content: 'Manage server nuke requests - approve, reject, or check status. Dev/Owner only!',
                examples: [
                    'nukerequest status',
                    'nukerequest status nuke-123456789-1234567890',
                    'nukerequest approve nuke-123456789-1234567890',
                    'nukerequest reject nuke-123456789-1234567890 Too risky',
                ],
                usage: 'nukerequest <status|approve|reject> [request_id] [options]',
            },
            category: 'template',
            aliases: ['nrequests', 'nukes'],
            cooldown: 5,
            args: true,
            permissions: {
                dev: true,
            },
            slashCommand: true,
            options: [
                {
                    name: 'action',
                    description: 'What action to perform',
                    type: 3,
                    required: true,
                    choices: [
                        { name: 'Status', value: 'status' },
                        { name: 'List', value: 'list' },
                        { name: 'Approve', value: 'approve' },
                        { name: 'Reject', value: 'reject' },
                    ],
                },
                {
                    name: 'request_id',
                    description: 'The nuke request ID (for status/approve/reject)',
                    type: 3,
                    required: false,
                    autocomplete: true,
                },
                {
                    name: 'reason',
                    description: 'Rejection reason or approval notes',
                    type: 3,
                    required: false,
                    max_length: 500,
                },
                {
                    name: 'execute',
                    description: 'Execute nuke immediately after approval?',
                    type: 5,
                    required: false,
                },
            ],
        });
    }

    // Helper method to handle editReply for both interactions and text commands
    async editReply(ctx, data) {
        if (ctx.isInteraction) {
            return ctx.interaction.editReply(data);
        }
        return ctx.reply(data);
    }

    async run(client, ctx, args, color, emoji, language) {
        const action = ctx.isInteraction ? ctx.interaction.options.getString('action') : args[0]?.toLowerCase();

        const requestId = ctx.isInteraction ? ctx.interaction.options.getString('request_id') : args[1];

        const reason = ctx.isInteraction ? ctx.interaction.options.getString('reason') : args.slice(2).join(' ');

        const executeNow = ctx.isInteraction ? ctx.interaction.options.getBoolean('execute') || false : args.includes('--execute');

        try {
            if (ctx.isInteraction) {
                await ctx.interaction.deferReply({ ephemeral: true });
            }

            switch (action) {
                case 'status':
                    return await this.handleStatus(client, ctx, requestId, color, emoji);
                case 'list':
                    return await this.handleList(client, ctx, color, emoji);
                case 'approve':
                    return await this.handleApprove(client, ctx, requestId, executeNow, color, emoji);
                case 'reject':
                    return await this.handleReject(client, ctx, requestId, reason || 'No reason provided', color, emoji);
                default:
                    const errorEmbed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`${emoji.FAIL} Unknown action. Use: status, list, approve, or reject`);
                    if (ctx.isInteraction) {
                        return ctx.interaction.editReply({ embeds: [errorEmbed] });
                    }
                    return ctx.reply({ embeds: [errorEmbed] });
            }
        } catch (error) {
            console.error('Nuke request command error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} An error occurred while processing the request.`);
            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await ctx.reply({ embeds: [errorEmbed] });
            }
        }
    }

    async handleStatus(client, ctx, requestId, color, emoji) {
        if (!requestId) {
            // Show all pending requests summary
            const pendingRequests = await NukeRequest.find({ status: 'pending' }).sort({
                requestedAt: -1,
            });

            if (pendingRequests.length === 0) {
                const noRequestsEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('✅ No Pending Requests')
                    .setDescription('There are no pending nuke requests at this time.');
                return this.editReply(ctx, { embeds: [noRequestsEmbed] });
            }

            const statusEmbed = new EmbedBuilder()
                .setColor(color.main)
                .setTitle(`📋 Pending Nuke Requests (${pendingRequests.length})`)
                .setDescription('Use `/nukerequest status <request_id>` to view details of a specific request.');

            pendingRequests.forEach((req) => {
                const createdTime = Math.floor(req.requestedAt.getTime() / 1000);
                statusEmbed.addFields({
                    name: `${req.guildName}`,
                    value:
                        `**Request ID:** \`${req.requestId}\`\n` +
                        `**Requester:** ${req.userTag}\n` +
                        `**Requested:** <t:${createdTime}:R>\n` +
                        `**What will be deleted:** ${req.channelCount} channels, ${req.roleCount} roles`,
                    inline: false,
                });
            });

            statusEmbed.setFooter({
                text: `Total pending: ${pendingRequests.length}`,
            });

            return this.editReply(ctx, { embeds: [statusEmbed] });
        }

        // Show specific request details
        const nukeRequest = await NukeRequest.findOne({ requestId });

        if (!nukeRequest) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Nuke request not found!`);
            return this.editReply(ctx, { embeds: [errorEmbed] });
        }

        const statusEmbed = new EmbedBuilder()
            .setColor(
                nukeRequest.status === 'pending'
                    ? 'Yellow'
                    : nukeRequest.status === 'approved'
                      ? 'Green'
                      : nukeRequest.status === 'rejected'
                        ? 'Red'
                        : 'Blue'
            )
            .setTitle(`📊 Nuke Request Details`)
            .addFields(
                {
                    name: 'Request ID',
                    value: `\`${nukeRequest.requestId}\``,
                    inline: false,
                },
                {
                    name: 'Status',
                    value: `**${nukeRequest.status.toUpperCase()}**`,
                    inline: true,
                },
                {
                    name: 'Server',
                    value: nukeRequest.guildName,
                    inline: true,
                },
                {
                    name: 'Requester',
                    value: nukeRequest.userTag,
                    inline: true,
                },
                {
                    name: 'Requested',
                    value: `<t:${Math.floor(nukeRequest.requestedAt.getTime() / 1000)}:F>`,
                    inline: true,
                },
                {
                    name: 'Reason',
                    value: nukeRequest.reason,
                    inline: false,
                },
                {
                    name: 'Server Stats',
                    value:
                        `**Channels:** ${nukeRequest.channelCount}\n` +
                        `**Roles:** ${nukeRequest.roleCount}\n` +
                        `**Members:** ${nukeRequest.memberCount}`,
                    inline: true,
                }
            );

        if (nukeRequest.status !== 'pending') {
            statusEmbed.addFields({
                name: 'Review Info',
                value:
                    `**Reviewed By:** ${nukeRequest.approverTag}\n` +
                    `**Reviewed:** <t:${Math.floor(nukeRequest.approvedAt.getTime() / 1000)}:F>`,
                inline: false,
            });

            if (nukeRequest.status === 'rejected') {
                statusEmbed.addFields({
                    name: 'Rejection Reason',
                    value: nukeRequest.rejectionReason,
                    inline: false,
                });
            }

            if (nukeRequest.status === 'executed') {
                statusEmbed.addFields({
                    name: 'Executed',
                    value: `<t:${Math.floor(nukeRequest.executedAt.getTime() / 1000)}:F>`,
                    inline: true,
                });
            }
        } else {
            statusEmbed.addFields({
                name: 'Actions',
                value: 'Use `/nukerequest approve <id>` to approve\n' + 'Use `/nukerequest reject <id> <reason>` to reject',
                inline: false,
            });
        }

        return this.editReply(ctx, { embeds: [statusEmbed] });
    }

    async handleList(client, ctx, color, emoji) {
        const allRequests = await NukeRequest.find().sort({ requestedAt: -1 }).limit(20);

        if (allRequests.length === 0) {
            const emptyEmbed = new EmbedBuilder().setColor('Gray').setDescription('No nuke requests found.');
            return this.editReply(ctx, { embeds: [emptyEmbed] });
        }

        // Group by status
        const byStatus = {
            pending: [],
            approved: [],
            rejected: [],
            executed: [],
        };

        allRequests.forEach((req) => {
            byStatus[req.status].push(req);
        });

        const listEmbed = new EmbedBuilder()
            .setColor(color.main)
            .setTitle('📋 All Nuke Requests')
            .setDescription(`Total: ${allRequests.length} requests`);

        // Add sections for each status
        Object.entries(byStatus).forEach(([status, requests]) => {
            if (requests.length > 0) {
                const statusEmoji = status === 'pending' ? '⏳' : status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '🎯';

                const summary = requests
                    .slice(0, 3)
                    .map((r) => `• ${r.guildName} (${r.userTag})`)
                    .join('\n');

                listEmbed.addFields({
                    name: `${statusEmoji} ${status.toUpperCase()} (${requests.length})`,
                    value: summary || 'None',
                    inline: false,
                });
            }
        });

        listEmbed.setFooter({
            text: 'Use /nukerequest status <id> for details',
        });

        return this.editReply(ctx, { embeds: [listEmbed] });
    }

    async handleApprove(client, ctx, requestId, executeNow, color, emoji) {
        if (!requestId) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Please provide a request ID to approve.`);
            return this.editReply(ctx, { embeds: [errorEmbed] });
        }

        // Find the request
        const nukeRequest = await NukeRequest.findOne({ requestId });

        if (!nukeRequest) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Nuke request not found!`);
            return this.editReply(ctx, { embeds: [errorEmbed] });
        }

        // Check if already processed
        if (nukeRequest.status !== 'pending') {
            const statusEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(`${emoji.TIMEOUT} This request is already **${nukeRequest.status}**.`);
            return this.editReply(ctx, { embeds: [statusEmbed] });
        }

        // Get the guild
        const guild = client.guilds.cache.get(nukeRequest.guildId);
        if (!guild) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} The server for this request no longer exists.`);
            return this.editReply(ctx, { embeds: [notFoundEmbed] });
        }

        // Update request status
        nukeRequest.status = 'approved';
        nukeRequest.approvedBy = ctx.author.id;
        nukeRequest.approverUsername = ctx.author.username;
        nukeRequest.approverTag = ctx.author.tag;
        nukeRequest.approvedAt = new Date();
        await nukeRequest.save();

        // Notify the server owner
        const approvalEmbed = new EmbedBuilder()
            .setColor(color.main)
            .setTitle('✅ Nuke Request Approved')
            .setDescription(`Your server nuke request has been **APPROVED** by the bot owner.`)
            .addFields(
                {
                    name: 'Server',
                    value: nukeRequest.guildName,
                    inline: true,
                },
                {
                    name: 'Approved By',
                    value: ctx.author.tag,
                    inline: true,
                },
                {
                    name: 'Request ID',
                    value: `\`${requestId}\``,
                    inline: false,
                }
            );

        try {
            const owner = await guild.members.fetch(nukeRequest.userId).catch(() => null);
            if (owner) {
                await owner.send({ embeds: [approvalEmbed] });
            }
        } catch (error) {
            console.error('Failed to notify server owner:', error);
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor(color.main)
            .setTitle('✅ Request Approved')
            .setDescription(`Nuke request **${requestId}** has been approved.`)
            .addFields(
                {
                    name: 'Server',
                    value: nukeRequest.guildName,
                    inline: true,
                },
                {
                    name: 'Requester',
                    value: nukeRequest.userTag,
                    inline: true,
                }
            );

        if (executeNow) {
            confirmEmbed.addFields({
                name: 'Status',
                value: '🔄 Executing nuke...',
                inline: false,
            });

            await this.editReply(ctx, { embeds: [confirmEmbed] });
            await this.executeNuke(client, guild, nukeRequest, ctx, color, emoji);
        } else {
            confirmEmbed.addFields({
                name: 'Status',
                value: '⏳ Awaiting execution\nUse `/nukerequest approve <id> --execute` to execute now',
                inline: false,
            });
            await this.editReply(ctx, { embeds: [confirmEmbed] });
        }
    }

    async handleReject(client, ctx, requestId, reason, color, emoji) {
        if (!requestId) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Please provide a request ID to reject.`);
            return this.editReply(ctx, { embeds: [errorEmbed] });
        }

        // Find the request
        const nukeRequest = await NukeRequest.findOne({ requestId });

        if (!nukeRequest) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Nuke request not found!`);
            return this.editReply(ctx, { embeds: [errorEmbed] });
        }

        // Check if already processed
        if (nukeRequest.status !== 'pending') {
            const statusEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(`${emoji.TIMEOUT} This request is already **${nukeRequest.status}**.`);
            return this.editReply(ctx, { embeds: [statusEmbed] });
        }

        // Update request status
        nukeRequest.status = 'rejected';
        nukeRequest.approvedBy = ctx.author.id;
        nukeRequest.approverUsername = ctx.author.username;
        nukeRequest.approverTag = ctx.author.tag;
        nukeRequest.rejectionReason = reason;
        nukeRequest.approvedAt = new Date();
        await nukeRequest.save();

        // Get the guild and notify the server owner
        const guild = client.guilds.cache.get(nukeRequest.guildId);
        const rejectionEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Nuke Request Rejected')
            .setDescription(`Your server nuke request has been **REJECTED** by the bot owner.`)
            .addFields(
                {
                    name: 'Server',
                    value: nukeRequest.guildName,
                    inline: true,
                },
                {
                    name: 'Rejected By',
                    value: ctx.author.tag,
                    inline: true,
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false,
                }
            );

        try {
            if (guild) {
                const owner = await guild.members.fetch(nukeRequest.userId).catch(() => null);
                if (owner) {
                    await owner.send({ embeds: [rejectionEmbed] });
                }
            }
        } catch (error) {
            console.error('Failed to notify server owner:', error);
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor(color.main)
            .setTitle('✅ Request Rejected')
            .setDescription(`Nuke request **${requestId}** has been rejected.`)
            .addFields(
                {
                    name: 'Server',
                    value: nukeRequest.guildName,
                    inline: true,
                },
                {
                    name: 'Requester',
                    value: nukeRequest.userTag,
                    inline: true,
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false,
                }
            );

        await this.editReply(ctx, { embeds: [confirmEmbed] });
    }

    async executeNuke(client, guild, nukeRequest, ctx, color, emoji) {
        try {
            // Delete all channels
            const channels = await guild.channels.fetch();
            let deletedChannels = 0;

            for (const channel of channels.values()) {
                try {
                    await channel.delete();
                    deletedChannels++;
                } catch (error) {
                    console.error(`Failed to delete channel ${channel.name}:`, error);
                }
            }

            // Delete all custom roles
            const roles = await guild.roles.fetch();
            let deletedRoles = 0;

            for (const role of roles.values()) {
                if (!role.managed && role.name !== '@everyone') {
                    try {
                        await role.delete();
                        deletedRoles++;
                    } catch (error) {
                        console.error(`Failed to delete role ${role.name}:`, error);
                    }
                }
            }

            // Create a general channel to notify about the nuke
            const newChannel = await guild.channels.create({
                name: 'restarting',
                type: ChannelType.GuildText,
            });

            const restartEmbed = new EmbedBuilder()
                .setColor(color.main)
                .setTitle(`${emoji.SUCCESS} Server Nuke Complete!`)
                .setDescription('Your server has been successfully nuked and reset to factory settings.')
                .addFields(
                    {
                        name: 'Channels Deleted',
                        value: `${deletedChannels}`,
                        inline: true,
                    },
                    {
                        name: 'Roles Deleted',
                        value: `${deletedRoles}`,
                        inline: true,
                    },
                    {
                        name: 'Next Steps',
                        value: 'Load a template with `/templateload` to restore your server.',
                        inline: false,
                    }
                )
                .setTimestamp();

            await newChannel.send({ embeds: [restartEmbed] });

            // Update request status to executed
            nukeRequest.status = 'executed';
            nukeRequest.executedAt = new Date();
            await nukeRequest.save();

            const successEmbed = new EmbedBuilder()
                .setColor(color.main)
                .setTitle('✅ Nuke Executed Successfully!')
                .addFields(
                    {
                        name: 'Channels Deleted',
                        value: `${deletedChannels}`,
                        inline: true,
                    },
                    {
                        name: 'Roles Deleted',
                        value: `${deletedRoles}`,
                        inline: true,
                    },
                    {
                        name: 'Server',
                        value: nukeRequest.guildName,
                        inline: true,
                    }
                );

            await this.editReply(ctx, { embeds: [successEmbed] });
        } catch (error) {
            console.error('Nuke execution error:', error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} An error occurred during nuke execution.`);
            await this.editReply(ctx, { embeds: [errorEmbed] });
        }
    }
};

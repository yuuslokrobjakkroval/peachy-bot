 const { Command } = require('../../structures/index.js');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const NukeRequest = require('../../schemas/nukeRequest.js');

module.exports = class TemplateNuke extends Command {
    constructor(client) {
        super(client, {
            name: 'templatenuke',
            description: {
                content: 'Request approval to completely reset your server by deleting all channels and roles. Owner only! ⚠️',
                examples: ['templatenuke', 'templatenuke Cleaning up the server'],
                usage: 'templatenuke [reason]',
            },
            category: 'template',
            aliases: ['nuke', 'servernuke', 'requestnuke'],
            cooldown: 30,
            permissions: {
                user: ['ManageGuild'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'reason',
                    description: 'Reason for requesting a server nuke (optional)',
                    type: 3,
                    required: false,
                    max_length: 500,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        // Verify user is server owner
        if (ctx.guild.ownerId !== ctx.author.id) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Only the server owner can request a nuke!`);
            if (ctx.isInteraction) {
                return ctx.interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            return ctx.reply({ embeds: [errorEmbed] });
        }

        // Get reason
        let reason = '';
        if (ctx.isInteraction) {
            reason = ctx.interaction.options.getString('reason') || 'No reason provided';
        } else {
            reason = args.join(' ') || 'No reason provided';
        }

        try {
            // Check for existing pending request
            const existingRequest = await NukeRequest.findOne({
                guildId: ctx.guild.id,
                status: 'pending',
            });

            if (existingRequest) {
                const existingEmbed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setTitle('⚠️ Request Already Pending')
                    .setDescription(
                        `You already have a pending nuke request for this server.\n\n` +
                            `**Requested:** <t:${Math.floor(existingRequest.requestedAt.getTime() / 1000)}:R>\n` +
                            `**Status:** Awaiting approval from bot owner\n\n` +
                            `The bot owner will review your request shortly.`
                    );
                if (ctx.isInteraction) {
                    return ctx.interaction.reply({ embeds: [existingEmbed], ephemeral: true });
                }
                return ctx.reply({ embeds: [existingEmbed], ephemeral: true });
            }

            // Create a modal for final confirmation
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

            const modal = new ModalBuilder().setCustomId('nuke_request_confirmation').setTitle(`Type "${ctx.guild.name}" to confirm nuke`);

            const serverNameInput = new TextInputBuilder()
                .setCustomId('server_name')
                .setLabel(`Server: ${ctx.guild.name}`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(ctx.guild.name)
                .setValue('')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(serverNameInput));

            if (!ctx.isInteraction) {
                // Text commands can't show modals, cancel request
                const textEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`${emoji.FAIL} Modal confirmations are only available for slash commands.`);
                return await ctx.reply({ embeds: [textEmbed] });
            }

            await ctx.interaction.showModal(modal);

            // Handle modal submission
            const modalSubmitted = await ctx.interaction
                .awaitModalSubmit({
                    filter: (i) => i.customId === 'nuke_request_confirmation',
                    time: 60000,
                })
                .catch(() => null);

            if (!modalSubmitted) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(`${emoji.TIMEOUT} Nuke request confirmation timed out. Request cancelled.`);
                return await confirmMessage.edit({ embeds: [timeoutEmbed] });
            }

            const enteredName = modalSubmitted.fields.getTextInputValue('server_name');

            // Verify the entered name matches
            if (enteredName !== ctx.guild.name) {
                const wrongNameEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`${emoji.FAIL} Server name doesn't match! Expected: **${ctx.guild.name}**, Got: **${enteredName}**`);
                return await modalSubmitted.reply({
                    embeds: [wrongNameEmbed],
                    ephemeral: true,
                });
            }

            await modalSubmitted.deferReply({ ephemeral: true });

            // Create nuke request in database
            const requestId = `nuke-${ctx.guild.id}-${Date.now()}`;

            const nukeRequest = await NukeRequest.create({
                requestId,
                guildId: ctx.guild.id,
                guildName: ctx.guild.name,
                userId: ctx.author.id,
                username: ctx.author.username,
                userTag: ctx.author.tag,
                reason,
                channelCount: ctx.guild.channels.cache.size,
                roleCount: ctx.guild.roles.cache.size,
                memberCount: ctx.guild.memberCount,
                status: 'pending',
            });

            const requestEmbed = new EmbedBuilder()
                .setColor(color.main)
                .setTitle('✅ Nuke Request Submitted')
                .setDescription('Your server nuke request has been submitted for review.')
                .addFields(
                    {
                        name: 'Request ID',
                        value: `\`${requestId}\``,
                        inline: false,
                    },
                    {
                        name: 'Server',
                        value: ctx.guild.name,
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: '⏳ Pending Review',
                        inline: true,
                    },
                    {
                        name: 'Reason',
                        value: reason,
                        inline: false,
                    },
                    {
                        name: 'What will be deleted',
                        value:
                            `• ${ctx.guild.channels.cache.size} channels\n` +
                            `• ${ctx.guild.roles.cache.size - 1} roles\n` +
                            `• All messages and content`,
                        inline: false,
                    }
                )
                .setFooter({ text: 'The bot owner will review and respond shortly' })
                .setTimestamp();

            // Notify bot owner (you)
            try {
                const botOwner = await client.users.fetch(client.config.ownerId || client.application.owner.id);
                const ownerEmbed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setTitle('🔔 New Nuke Request - Review Required')
                    .addFields(
                        {
                            name: 'Request ID',
                            value: `\`${requestId}\``,
                            inline: false,
                        },
                        {
                            name: 'Server Info',
                            value: `**Name:** ${ctx.guild.name}\n` + `**ID:** ${ctx.guild.id}\n` + `**Members:** ${ctx.guild.memberCount}`,
                            inline: false,
                        },
                        {
                            name: 'Requester',
                            value:
                                `**User:** ${ctx.author.tag}\n` +
                                `**ID:** ${ctx.author.id}\n` +
                                `**Server Owner:** ${ctx.guild.ownerId === ctx.author.id ? 'Yes' : 'No'}`,
                            inline: false,
                        },
                        {
                            name: 'Reason',
                            value: reason,
                            inline: false,
                        },
                        {
                            name: 'What will be deleted',
                            value: `• ${ctx.guild.channels.cache.size} channels\n` + `• ${ctx.guild.roles.cache.size - 1} roles`,
                            inline: false,
                        },
                        {
                            name: 'Action Required',
                            value: `Use \`/approvenukeRequest\` or \`/rejectnukeRequest\` to respond`,
                            inline: false,
                        }
                    )
                    .setTimestamp();

                await botOwner.send({ embeds: [ownerEmbed] });
            } catch (error) {
                console.error('Failed to notify bot owner:', error);
            }

            await modalSubmitted.reply({ embeds: [requestEmbed], ephemeral: true });
        } catch (error) {
            console.error('Template nuke request error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} An error occurred while processing your nuke request.`);
            if (ctx.isInteraction) {
                try {
                    await ctx.interaction.editReply({ embeds: [errorEmbed] });
                } catch (e) {
                    await ctx.interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } else {
                await ctx.reply({ embeds: [errorEmbed] });
            }
        }
    }
};

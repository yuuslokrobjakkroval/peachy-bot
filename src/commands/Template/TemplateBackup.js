const { Command } = require('../../structures/index.js');
const { EmbedBuilder, ChannelType } = require('discord.js');
const ServerTemplate = require('../../schemas/serverTemplate.js');

module.exports = class TemplateBackup extends Command {
    constructor(client) {
        super(client, {
            name: 'templatebackup',
            description: {
                content: 'Backup your entire server configuration to a template for later use.',
                examples: ['templatebackup MyGamingServer'],
                usage: 'templatebackup <template_name>',
            },
            category: 'template',
            aliases: ['backup', 'tbackup'],
            cooldown: 10,
            args: true,
            permissions: {
                user: ['ManageGuild'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'name',
                    description: 'The name for this template backup.',
                    type: 3,
                    required: true,
                    max_length: 100,
                },
                {
                    name: 'description',
                    description: 'A description of this template.',
                    type: 3,
                    required: false,
                    max_length: 500,
                },
                {
                    name: 'tags',
                    description: 'Tags for the template (comma-separated, max 5).',
                    type: 3,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        let templateName, templateDescription, templateTags;

        if (ctx.isInteraction) {
            templateName = ctx.interaction.options.getString('name');
            templateDescription = ctx.interaction.options.getString('description') || null;
            const tagsInput = ctx.interaction.options.getString('tags');
            templateTags = tagsInput
                ? tagsInput
                      .split(',')
                      .map((t) => t.trim())
                      .slice(0, 5)
                : [];
        } else {
            templateName = args[0];
            templateDescription = args.slice(1).join(' ') || null;
            templateTags = [];
        }

        // Verify user is server owner AND has Administrator permission
        if (ctx.guild.ownerId !== ctx.author.id) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Only the server owner can create backups!`);
            if (ctx.isInteraction) {
                return ctx.interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            return ctx.reply({ embeds: [errorEmbed] });
        }

        // Check for Administrator role
        if (!ctx.member.permissions.has('Administrator')) {
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} You must have Administrator permission to create backups!`);
            if (ctx.isInteraction) {
                return ctx.interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            return ctx.reply({ embeds: [errorEmbed] });
        }

        try {
            if (ctx.isInteraction) {
                await ctx.interaction.deferReply();
            }

            // Collect all channels
            const channels = ctx.guild.channels.cache;
            const channelTemplates = channels
                .filter((ch) => ch.type !== ChannelType.GuildCategory)
                .map((ch) => ({
                    name: ch.name,
                    type: ch.type === ChannelType.GuildText ? 'text' : ch.type === ChannelType.GuildVoice ? 'voice' : 'category',
                    description: ch.topic || null,
                    position: ch.position,
                    category: ch.parentId || null,
                    nsfw: ch.nsfw || false,
                }));

            // Collect all roles
            const roles = ctx.guild.roles.cache
                .filter((r) => !r.managed)
                .map((r) => ({
                    name: r.name,
                    color: r.hexColor,
                    hoist: r.hoist,
                    permissions: r.permissions.toArray(),
                    position: r.position,
                }));

            // Create template ID
            const templateId = `${ctx.guild.id}-${Date.now()}`;

            // Create backup template
            const newTemplate = await ServerTemplate.create({
                templateId,
                title: templateName,
                description: templateDescription || `Backup of ${ctx.guild.name}`,
                fullDescription: templateDescription,
                tags: templateTags,
                creator: ctx.author.username,
                creatorId: ctx.author.id,
                features: ['Custom Channels', 'Custom Roles', 'Server Configuration'],
                channels: channelTemplates.length,
                roles: roles.length,
                channelTemplates,
                roleTemplates: roles,
                config: {
                    language: 'en',
                    prefix: '!',
                    defaultRole: ctx.guild.roles.everyone.id,
                    modRole: null,
                    adminRole: null,
                },
                isPublished: false,
            });

            const successEmbed = new EmbedBuilder()
                .setColor(color.main)
                .setTitle(`${emoji.SUCCESS} Template Backup Created!`)
                .addFields(
                    {
                        name: 'Template Name',
                        value: templateName,
                        inline: true,
                    },
                    {
                        name: 'Template ID',
                        value: `\`${templateId}\``,
                        inline: true,
                    },
                    {
                        name: 'Channels Backed Up',
                        value: `${channelTemplates.length}`,
                        inline: true,
                    },
                    {
                        name: 'Roles Backed Up',
                        value: `${roles.length}`,
                        inline: true,
                    },
                    {
                        name: 'Creator',
                        value: ctx.author.username,
                        inline: true,
                    },
                    {
                        name: 'Status',
                        value: 'Private (Owner only)',
                        inline: true,
                    }
                )
                .setTimestamp();

            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ embeds: [successEmbed] });
            } else {
                await ctx.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            console.error('Template backup error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} Failed to create backup. Please try again later.`);
            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await ctx.reply({ embeds: [errorEmbed] });
            }
        }
    }
};

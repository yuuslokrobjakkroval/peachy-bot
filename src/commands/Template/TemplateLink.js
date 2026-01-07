const { Command } = require('../../structures/index.js');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const ServerTemplate = require('../../schemas/serverTemplate.js');

module.exports = class TemplateLink extends Command {
    constructor(client) {
        super(client, {
            name: 'templatelink',
            description: {
                content: 'Generate a shareable link for your template or publish it publicly.',
                examples: ['templatelink MyGamingServer', 'templatelink MyGamingServer --public'],
                usage: 'templatelink <template_name> [--public]',
            },
            category: 'template',
            aliases: ['tlink', 'sharetemplate'],
            cooldown: 5,
            args: true,
            permissions: {
                user: ['ManageGuild'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'template',
                    description: 'The template name or ID to generate a link for.',
                    type: 3,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: 'public',
                    description: 'Make the template publicly available?',
                    type: 5,
                    required: false,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        let templateQuery, isPublic;

        if (ctx.isInteraction) {
            templateQuery = ctx.interaction.options.getString('template');
            isPublic = ctx.interaction.options.getBoolean('public') || false;
        } else {
            templateQuery = args[0];
            isPublic = args.includes('--public');
        }

        try {
            if (ctx.isInteraction) {
                await ctx.interaction.deferReply();
            }

            // Find template
            const template = await ServerTemplate.findOne({
                $or: [{ templateId: templateQuery }, { title: new RegExp(templateQuery, 'i') }],
                creatorId: ctx.author.id,
            });

            if (!template) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`${emoji.FAIL} Template not found or you don't have permission to share it!`);
                if (ctx.isInteraction) {
                    return ctx.interaction.editReply({ embeds: [errorEmbed] });
                }
                return ctx.reply({ embeds: [errorEmbed] });
            }

            // Update template publishing status
            template.isPublished = isPublic;
            template.statistics.totalViews = template.statistics.totalViews || 0;
            await template.save();

            // Generate link using template ID
            const templateLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&scope=bot&guild_id=${ctx.guild.id}&template=${template.templateId}`;

            // Create invite link (alternative method)
            const inviteLink = `https://discord.gg/${template.templateId}`;

            // Create embed with template info
            const linkEmbed = new EmbedBuilder()
                .setColor(color.main)
                .setTitle(`${emoji.SUCCESS} Template Link Generated!`)
                .setDescription(`Template: **${template.title}**`)
                .addFields(
                    {
                        name: '📋 Template ID',
                        value: `\`${template.templateId}\``,
                        inline: false,
                    },
                    {
                        name: '🔗 Share Link',
                        value: `[Click here to copy](${templateLink})`,
                        inline: false,
                    },
                    {
                        name: '📊 Status',
                        value: isPublic ? '🌐 Public (Visible to everyone)' : '🔒 Private (Owner only)',
                        inline: true,
                    },
                    {
                        name: '📈 Current Uses',
                        value: `${template.uses}`,
                        inline: true,
                    },
                    {
                        name: '❤️ Upvotes',
                        value: `${template.upvotes}`,
                        inline: true,
                    }
                )
                .setFooter({
                    text: `Template created by ${template.creator} • Use /templatesearch to find it`,
                })
                .setTimestamp();

            // Copy button
            const copyButton = new ButtonBuilder()
                .setCustomId('copy_template_id')
                .setLabel('Copy Template ID')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋');

            const shareButton = new ButtonBuilder()
                .setLabel('Share Template')
                .setStyle(ButtonStyle.Link)
                .setURL(templateLink)
                .setEmoji('🔗');

            const toggleButton = new ButtonBuilder()
                .setCustomId('toggle_template_visibility')
                .setLabel(isPublic ? 'Make Private' : 'Make Public')
                .setStyle(isPublic ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(isPublic ? '🔒' : '🌐');

            const row = new ActionRowBuilder().addComponents(copyButton, shareButton, toggleButton);

            await ctx.interaction.editReply({ embeds: [linkEmbed], components: [row] });

            // Handle button interactions
            const filter = async (i) => i.user.id === ctx.author.id && i.message.id === (await ctx.fetchReply()).id;

            const collector = ctx.channel.createMessageComponentCollector({
                filter,
                time: 60000,
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'copy_template_id') {
                    const copyEmbed = new EmbedBuilder()
                        .setColor(color.main)
                        .setDescription(`${emoji.SUCCESS} Template ID copied to clipboard!\n\`${template.templateId}\``);
                    await interaction.reply({
                        embeds: [copyEmbed],
                        ephemeral: true,
                    });
                } else if (interaction.customId === 'toggle_template_visibility') {
                    template.isPublished = !template.isPublished;
                    await template.save();

                    const updatedEmbed = new EmbedBuilder()
                        .setColor(color.main)
                        .setDescription(`${emoji.SUCCESS} Template is now **${template.isPublished ? 'Public' : 'Private'}**`);
                    await interaction.reply({
                        embeds: [updatedEmbed],
                        ephemeral: true,
                    });

                    // Update the original embed
                    const updatedLinkEmbed = new EmbedBuilder()
                        .setColor(color.main)
                        .setTitle(`${emoji.SUCCESS} Template Link Generated!`)
                        .setDescription(`Template: **${template.title}**`)
                        .addFields(
                            {
                                name: '📋 Template ID',
                                value: `\`${template.templateId}\``,
                                inline: false,
                            },
                            {
                                name: '🔗 Share Link',
                                value: `[Click here to copy](${templateLink})`,
                                inline: false,
                            },
                            {
                                name: '📊 Status',
                                value: template.isPublished ? '🌐 Public (Visible to everyone)' : '🔒 Private (Owner only)',
                                inline: false,
                            },
                            {
                                name: '📈 Current Uses',
                                value: `${template.uses}`,
                                inline: false,
                            },
                            {
                                name: '❤️ Upvotes',
                                value: `${template.upvotes}`,
                                inline: false,
                            }
                        )
                        .setFooter({
                            text: `Template created by ${template.creator}`,
                        })
                        .setTimestamp();

                    const updatedToggleButton = new ButtonBuilder()
                        .setCustomId('toggle_template_visibility')
                        .setLabel(template.isPublished ? 'Make Private' : 'Make Public')
                        .setStyle(template.isPublished ? ButtonStyle.Danger : ButtonStyle.Success)
                        .setEmoji(template.isPublished ? '🔒' : '🌐');

                    const updatedRow = new ActionRowBuilder().addComponents(copyButton, shareButton, updatedToggleButton);

                    await interaction.message.edit({
                        embeds: [updatedLinkEmbed],
                        components: [updatedRow],
                    });
                }
            });

            collector.on('end', () => {
                const expiredEmbed = new EmbedBuilder().setColor('Gray').setDescription('${emoji.TIMEOUT} Button interaction expired.');
            });
        } catch (error) {
            console.error('Template link error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} An error occurred while generating the link.`);
            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await ctx.reply({ embeds: [errorEmbed] });
            }
        }
    }
};

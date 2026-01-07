const { Command } = require('../../structures/index.js');
const { EmbedBuilder, ChannelType } = require('discord.js');
const ServerTemplate = require('../../schemas/serverTemplate.js');

module.exports = class TemplateLoad extends Command {
    constructor(client) {
        super(client, {
            name: 'templateload',
            description: {
                content: 'Load a server template and apply it to your server. Requires server owner permission.',
                examples: ['templateload MyGamingServer', 'templateload 123456789-1234567890'],
                usage: 'templateload <template_name_or_id>',
            },
            category: 'template',
            aliases: ['tload', 'applytemplate'],
            cooldown: 20,
            args: true,
            permissions: {
                user: ['ManageGuild'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'template',
                    description: 'The template name or ID to load.',
                    type: 3,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: 'what',
                    description: 'What to load from the template.',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Everything', value: 'all' },
                        { name: 'Channels Only', value: 'channels' },
                        { name: 'Roles Only', value: 'roles' },
                    ],
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Verify user is server owner
        if (ctx.guild.ownerId !== ctx.author.id) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Only the server owner can load templates!`);
            return ctx.reply({ embeds: [errorEmbed] });
        }

        let templateQuery, loadWhat;

        if (ctx.isInteraction) {
            templateQuery = ctx.interaction.options.getString('template');
            loadWhat = ctx.interaction.options.getString('what') || 'all';
        } else {
            templateQuery = args[0];
            loadWhat = args[1]?.toLowerCase() || 'all';
        }

        try {
            if (ctx.isInteraction) {
                await ctx.interaction.deferReply();
            }

            // Find template
            const template = await ServerTemplate.findOne({
                $or: [{ templateId: templateQuery }, { title: new RegExp(templateQuery, 'i') }],
            });

            if (!template) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`${emoji.FAIL} Template not found! Use \`/templatesearch\` to find templates.`);
                if (ctx.isInteraction) {
                    return ctx.interaction.editReply({ embeds: [errorEmbed] });
                }
                return ctx.reply({ embeds: [errorEmbed] });
            }

            // Create confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('⚠️ Confirm Template Load')
                .setDescription(
                    `Loading the **${template.title}** template will:\n\n${
                        loadWhat === 'all' || loadWhat === 'channels' ? `✓ Create ${template.channels} channels\n` : ''
                    }${
                        loadWhat === 'all' || loadWhat === 'roles' ? `✓ Create ${template.roles} roles\n` : ''
                    }\n⚠️ This action cannot be undone. Continue?`
                )
                .setFooter({ text: `Template by ${template.creator}` });

            const confirmMessage = ctx.isInteraction
                ? await ctx.interaction.editReply({
                      embeds: [confirmEmbed],
                  })
                : await ctx.reply({ embeds: [confirmEmbed] });

            // Reaction collector for confirmation
            const filter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === ctx.author.id;
            const collector = confirmMessage.createReactionCollector({
                filter,
                time: 30000,
            });

            await confirmMessage.react('✅');
            await confirmMessage.react('❌');

            let confirmed = false;

            collector.on('collect', async (reaction) => {
                if (reaction.emoji.name === '✅') {
                    confirmed = true;
                    collector.stop();
                } else if (reaction.emoji.name === '❌') {
                    collector.stop();
                }
            });

            collector.on('end', async () => {
                if (!confirmed) {
                    const cancelEmbed = new EmbedBuilder().setColor('Red').setDescription(`${emoji.FAIL} Template loading cancelled.`);
                    return confirmMessage.edit({ embeds: [cancelEmbed] });
                }

                try {
                    // Load channels
                    if (loadWhat === 'all' || loadWhat === 'channels') {
                        for (const channelTemplate of template.channelTemplates) {
                            let parentId = null;

                            // Create category if needed
                            if (channelTemplate.type === 'category' || channelTemplate.category) {
                                const existingCategory = ctx.guild.channels.cache.find(
                                    (c) => c.name === channelTemplate.name && c.type === ChannelType.GuildCategory
                                );
                                if (!existingCategory) {
                                    const newCategory = await ctx.guild.channels.create({
                                        name: channelTemplate.name,
                                        type: ChannelType.GuildCategory,
                                        position: channelTemplate.position,
                                    });
                                    parentId = newCategory.id;
                                } else {
                                    parentId = existingCategory.id;
                                }
                            }

                            // Create text/voice channels
                            if (channelTemplate.type !== 'category') {
                                const existingChannel = ctx.guild.channels.cache.find((c) => c.name === channelTemplate.name);
                                if (!existingChannel) {
                                    await ctx.guild.channels.create({
                                        name: channelTemplate.name,
                                        type: channelTemplate.type === 'text' ? ChannelType.GuildText : ChannelType.GuildVoice,
                                        parent: parentId,
                                        topic: channelTemplate.description,
                                        nsfw: channelTemplate.nsfw,
                                        position: channelTemplate.position,
                                    });
                                }
                            }
                        }
                    }

                    // Load roles
                    if (loadWhat === 'all' || loadWhat === 'roles') {
                        for (const roleTemplate of template.roleTemplates) {
                            const existingRole = ctx.guild.roles.cache.find((r) => r.name === roleTemplate.name);
                            if (!existingRole) {
                                await ctx.guild.roles.create({
                                    name: roleTemplate.name,
                                    color: roleTemplate.color,
                                    hoist: roleTemplate.hoist,
                                    permissions: roleTemplate.permissions,
                                    position: roleTemplate.position,
                                });
                            }
                        }
                    }

                    // Update statistics
                    await ServerTemplate.updateOne(
                        { _id: template._id },
                        {
                            $inc: { uses: 1 },
                            $push: { 'statistics.downloads': new Date() },
                        }
                    );

                    const successEmbed = new EmbedBuilder()
                        .setColor(color.main)
                        .setTitle(`${emoji.SUCCESS} Template Loaded!`)
                        .setDescription(`The **${template.title}** template has been applied to your server.`)
                        .addFields(
                            {
                                name: 'Channels Created',
                                value: `${loadWhat === 'all' || loadWhat === 'channels' ? template.channels : 0}`,
                                inline: false,
                            },
                            {
                                name: 'Roles Created',
                                value: `${loadWhat === 'all' || loadWhat === 'roles' ? template.roles : 0}`,
                                inline: false,
                            }
                        )
                        .setTimestamp();

                    await confirmMessage.edit({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Template load error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`${emoji.FAIL} Failed to load template. Make sure I have the required permissions.`);
                    await confirmMessage.edit({ embeds: [errorEmbed] });
                }
            });
        } catch (error) {
            console.error('Template load error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${emoji.FAIL} An error occurred while loading the template.`);
            if (ctx.isInteraction) {
                await ctx.interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await ctx.reply({ embeds: [errorEmbed] });
            }
        }
    }
};

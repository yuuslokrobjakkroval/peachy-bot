const { ChannelType } = require('discord.js');
const Command = require('../../structures/Command.js');
const QuestConfig = require('../../schemas/questConfig');

module.exports = class Quest extends Command {
    constructor(client) {
        super(client, {
            name: 'quest',
            description: {
                content: 'Manage the Discord Quest Notifier system',
                examples: ['quest setup #quests @role', 'quest remove'],
                usage: 'quest [setup|remove]',
            },
            category: 'guild',
            aliases: ['questnotifier', 'quests'],
            cooldown: 3,
            args: false,
            player: {
                voice: false,
                dj: false,
                active: false,
                djPerm: null,
            },
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            slashCommand: true,
            options: [
                {
                    name: 'setup',
                    description: 'Set the channel to post new Discord Quest notifications',
                    type: 1, // SUB_COMMAND
                    options: [
                        {
                            name: 'channel',
                            description: 'The text channel where notifications will be sent',
                            type: 7, // CHANNEL
                            channel_types: [0], // GUILD_TEXT
                            required: true,
                        },
                        {
                            name: 'mention_role',
                            description: 'Optional: A role to ping when a new quest is posted',
                            type: 9, // ROLE
                            required: false,
                        },
                    ],
                },
                {
                    name: 'remove',
                    description: 'Stop receiving Discord Quest notifications',
                    type: 1, // SUB_COMMAND
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;
        const questMessages = language.locales.get(language.defaultLocale)?.questnotifier || {};

        // Check if this is a slash command or prefix command
        if (ctx.isCommand?.()) {
            // Slash command
            const subcommand = ctx.options.getSubcommand();
            if (subcommand === 'setup') {
                return this.handleSetup(client, ctx, color, emoji, questMessages, generalMessages);
            } else if (subcommand === 'remove') {
                return this.handleRemove(client, ctx, color, emoji, questMessages, generalMessages);
            }
        } else {
            // Prefix command
            const subcommand = args[0]?.toLowerCase();
            if (subcommand === 'setup') {
                return this.handleSetupPrefix(client, ctx, args, color, emoji, questMessages, generalMessages);
            } else if (subcommand === 'remove') {
                return this.handleRemove(client, ctx, color, emoji, questMessages, generalMessages);
            } else {
                const helpEmbed = client
                    .embed()
                    .setColor(color.warning)
                    .setTitle('🎁 Quest Notifier Help')
                    .setDescription(
                        `**Subcommands:**\n` +
                            `\`${client.config.prefix}quest setup <channel> [role]\` - Setup quest notifications\n` +
                            `\`${client.config.prefix}quest remove\` - Disable quest notifications`
                    );
                return ctx.channel.send({ embeds: [helpEmbed] });
            }
        }
    }

    async handleSetup(client, ctx, color, emoji, questMessages, generalMessages) {
        const channel = ctx.options.getChannel('channel');
        const role = ctx.options.getRole('mention_role');
        const guildId = ctx.guild.id;

        await ctx.deferReply({ ephemeral: true });

        try {
            await QuestConfig.findOneAndUpdate(
                { guildId },
                {
                    guildId,
                    channelId: channel.id,
                    roleId: role ? role.id : null,
                },
                { upsert: true, new: true }
            );

            const roleMention = role ? `<@&${role.id}>` : questMessages?.setup?.no_role || 'None';
            const successMessage =
                questMessages?.setup?.success ||
                `✅ **Quest Notifier Enabled!**\nNew Discord Quests will be posted in <#{channel}>.\nRole to mention: {role}`;

            const message = successMessage.replace('{channel}', channel.id).replace('{role}', roleMention);

            const successEmbed = client
                .embed()
                .setColor(color.success || 0x00ff00)
                .setDescription(message);

            return ctx.editReply({ embeds: [successEmbed] });
        } catch (error) {
            client.logger.error('[Quest] Setup error:', error);
            const errorEmbed = client
                .embed()
                .setColor(color.danger || 0xff0000)
                .setDescription('❌ An error occurred while setting up the quest notifier.');
            return ctx.editReply({ embeds: [errorEmbed] });
        }
    }

    async handleSetupPrefix(client, ctx, args, color, emoji, questMessages, generalMessages) {
        // Ensure we have a guild context
        if (!ctx.guild) {
            const errorEmbed = client.embed().setColor(color.danger).setDescription('❌ This command can only be used in a server.');
            return ctx.channel.send({ embeds: [errorEmbed] });
        }

        if (args.length < 2) {
            const helpEmbed = client
                .embed()
                .setColor(color.warning)
                .setTitle('🎁 Quest Setup Help')
                .setDescription(
                    `**Usage:** \`${client.config.prefix}quest setup <channel> [role]\`\n\n` +
                        `**Example:** \`${client.config.prefix}quest setup #quests @QuestRole\``
                );
            return ctx.channel.send({ embeds: [helpEmbed] });
        }

        // Try to get channel from mention first, then from ID
        const channelMention = ctx.mentions?.channels?.first();
        const channelId = args[1]?.replace(/[<>#]/g, '');
        const channel = channelMention || (channelId ? ctx.guild.channels.cache.get(channelId) : null);

        // Try to get role from mention first, then from ID
        const roleMention = ctx.mentions?.roles?.first();
        const roleId = args[2]?.replace(/[<>@&]/g, '');
        const role = roleMention || (roleId ? ctx.guild.roles.cache.get(roleId) : null);

        if (!channel || channel.type !== ChannelType.GuildText) {
            const errorEmbed = client.embed().setColor(color.danger).setDescription('❌ Please provide a valid text channel.');
            return ctx.channel.send({ embeds: [errorEmbed] });
        }

        const guildId = ctx.guild.id;

        try {
            await QuestConfig.findOneAndUpdate(
                { guildId },
                {
                    guildId,
                    channelId: channel.id,
                    roleId: role ? role.id : null,
                },
                { upsert: true, new: true }
            );

            const roleMention = role ? `<@&${role.id}>` : questMessages?.setup?.no_role || 'None';
            const successMessage =
                questMessages?.setup?.success ||
                `✅ **Quest Notifier Enabled!**\nNew Discord Quests will be posted in <#{channel}>.\nRole to mention: {role}`;

            const message = successMessage.replace('{channel}', channel.id).replace('{role}', roleMention);

            const successEmbed = client
                .embed()
                .setColor(color.success || 0x00ff00)
                .setDescription(message);

            return ctx.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            client.logger.error('[Quest] Setup error:', error);
            const errorEmbed = client
                .embed()
                .setColor(color.danger || 0xff0000)
                .setDescription('❌ An error occurred while setting up the quest notifier.');
            return ctx.channel.send({ embeds: [errorEmbed] });
        }
    }

    async handleRemove(client, ctx, color, emoji, questMessages, generalMessages) {
        const guildId = ctx.guild.id;

        // Only defer if it's a slash command (Interaction), not a prefix command (Message)
        if (ctx.deferReply) {
            await ctx.deferReply({ ephemeral: true });
        }

        try {
            const config = await QuestConfig.findOne({ guildId });
            if (!config) {
                const notSetupMessage = questMessages?.unset?.not_setup || 'ℹ️ Quest Notifier system has not been set up yet.';
                const embed = client
                    .embed()
                    .setColor(color.warning || 0xffa500)
                    .setDescription(notSetupMessage);
                return ctx.editReply ? ctx.editReply({ embeds: [embed] }) : ctx.channel.send({ embeds: [embed] });
            }

            await QuestConfig.deleteOne({ guildId });

            const successMessage =
                questMessages?.unset?.success || '🗑️ **Quest Notifier Disabled.** You will no longer receive notifications.';

            const embed = client
                .embed()
                .setColor(color.danger || 0xff0000)
                .setDescription(successMessage);

            return ctx.editReply ? ctx.editReply({ embeds: [embed] }) : ctx.channel.send({ embeds: [embed] });
        } catch (error) {
            client.logger.error('[Quest] Remove error:', error);
            const errorEmbed = client
                .embed()
                .setColor(color.danger || 0xff0000)
                .setDescription('❌ An error occurred while removing the quest notifier.');
            return ctx.editReply ? ctx.editReply({ embeds: [errorEmbed] }) : ctx.channel.send({ embeds: [errorEmbed] });
        }
    }
};

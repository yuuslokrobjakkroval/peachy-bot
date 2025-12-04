const { ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const { Command } = require('../../structures/index.js');
const UserCommunity = require('../../schemas/userCommunity');

module.exports = class CheckRoles extends Command {
    constructor(client) {
        super(client, {
            name: 'checkroles',
            description: {
                content: 'View all users under a specific role and check their profile.',
                examples: ['checkroles', 'checkroles owner'],
                usage: 'checkroles [role]',
            },
            category: 'community',
            aliases: ['roles', 'roleinfo', 'checkrole', 'role', 'cr'],
            cooldown: 3,
            args: false,
            permissions: {
                dev: false,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'role',
                    description: 'Filter by community role (owner, developer, staff, partnership)',
                    type: 3, // STRING
                    required: false,
                    choices: [
                        { name: 'Owner', value: 'Owner' },
                        { name: 'Developer', value: 'Developer' },
                        { name: 'Staff', value: 'Staff' },
                        { name: 'Partnership', value: 'Partnership' },
                    ],
                },
            ],
        });
    }

    /**
     * Helper to pretty format date or return fallback
     */
    formatDate(date) {
        if (!date) return 'N/A';
        try {
            return `<t:${Math.floor(date.getTime() / 1000)}:R>`; // e.g. "2 hours ago"
        } catch {
            return date.toISOString ? date.toISOString() : String(date);
        }
    }

    /**
     * Build role selector menu
     */
    buildRoleSelectMenu(selectedRole = null) {
        return new StringSelectMenuBuilder()
            .setCustomId(`checkroles_roleselect_${Date.now()}`)
            .setPlaceholder('Select a role to filter users')
            .addOptions([
                {
                    label: 'Owner',
                    value: 'Owner',
                    description: 'View all Owner members',
                    default: selectedRole === 'Owner',
                },
                {
                    label: 'Developer',
                    value: 'Developer',
                    description: 'View all Developer members',
                    default: selectedRole === 'Developer',
                },
                {
                    label: 'Staff',
                    value: 'Staff',
                    description: 'View all Staff members',
                    default: selectedRole === 'Staff',
                },
                {
                    label: 'Partnership',
                    value: 'Partnership',
                    description: 'View all Partnership members',
                    default: selectedRole === 'Partnership',
                },
            ]);
    }

    /**
     * Build user selector menu from users in a role
     */
    buildUserSelectMenu(users, role) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`checkroles_userselect_${role}_${Date.now()}`)
            .setPlaceholder(`Select a ${role} to view profile`);

        // Add user options (max 25)
        const displayUsers = users.slice(0, 25);
        selectMenu.addOptions(
            displayUsers.map((user, index) => ({
                label: user.displayName || user.username || `${role} ${index + 1}`,
                value: user.userId,
                description: `ID: ${user.userId.substring(0, 10)}...`,
            }))
        );

        return selectMenu;
    }

    /**
     * Build users list container
     */
    buildUsersListContainer({ color, emoji, generalMessages, role, users, ctx }) {
        const container = new ContainerBuilder().setAccentColor(color.main);

        container.addTextDisplayComponents((text) =>
            text.setContent(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft || '🧡')
                    .replace('%{title}', `${role.toUpperCase()} MEMBERS`)
                    .replace('%{mainRight}', emoji.mainRight || '🧡')
            )
        );

        container.addSeparatorComponents((sep) => sep);

        if (users.length === 0) {
            container.addTextDisplayComponents((text) => text.setContent(`📭 No users found.`));
        } else {
            const userList = users
                .slice(0, 20)
                .map((user, index) => `${index + 1}. <@${user.userId}> (\`${user.userId}\`)`)
                .join('\n');

            container.addTextDisplayComponents((text) =>
                text.setContent(`**Total Members:** ${users.length}\n\n**Members:**\n${userList}`)
            );

            if (users.length > 20) {
                container.addTextDisplayComponents((text) => text.setContent(`*... and ${users.length - 20} more members*`));
            }
        }

        container.addSeparatorComponents((sep) => sep.setDivider(false));
        container.addTextDisplayComponents((text) =>
            text.setContent(`*${generalMessages.requestedBy.replace('%{username}', ctx.author.displayName)}*`)
        );

        return container;
    }

    /**
     * Build profile container for selected user
     */
    buildProfileContainer({ color, emoji, generalMessages, user, doc, ctx }) {
        const container = new ContainerBuilder().setAccentColor(color.main);

        container.addTextDisplayComponents((text) =>
            text.setContent(
                generalMessages.title
                    .replace('%{mainLeft}', emoji.mainLeft || '🧡')
                    .replace('%{title}', `${doc.role.toUpperCase()} PROFILE`)
                    .replace('%{mainRight}', emoji.mainRight || '🧡')
            )
        );

        container.addSeparatorComponents((sep) => sep);

        // Discord Profile Section
        const createdTimestamp = Math.floor(user.createdTimestamp / 1000);
        const accountAge = `<t:${createdTimestamp}:R>`;

        container.addSectionComponents((section) =>
            section
                .addTextDisplayComponents(
                    (text) =>
                        text.setContent(
                            `**Username :** \`${user.username}\`\n**Display Name :** ${user.displayName}\n**User ID :** \`${user.id}\``
                        ),
                    (text) =>
                        text.setContent(
                            `**Account Created :** ${accountAge}\n**Bot :** ${user.bot ? 'Yes ✓' : 'No'}\n**System :** ${user.system ? 'Yes ✓' : 'No'}`
                        )
                )
                .setThumbnailAccessory((thumb) =>
                    thumb.setURL(user.displayAvatarURL({ dynamic: true, size: 256 })).setDescription(user.username)
                )
        );

        container.addSeparatorComponents((sep) => sep);

        // Role-specific information
        const role = doc.role;
        const roleData = doc[role.toLowerCase()];

        if (roleData) {
            container.addTextDisplayComponents((text) => {
                let content = `**Role :** \`${role}\`\n`;
                content += `**Joined :** ${this.formatDate(roleData.joinedDate)}\n\n`;

                if (role === 'Owner') {
                    content += `**Permissions :** ${
                        roleData.permissions && roleData.permissions.length
                            ? roleData.permissions.map((p) => `\`${p}\``).join(', ')
                            : '`None`'
                    }\n`;
                    content += `**Notes :** ${roleData.notes || '_No notes_'}`;
                } else if (role === 'Developer') {
                    content += `**Specialization :** ${roleData.specialization || '`N/A`'}\n`;
                    content += `**Projects :** ${
                        roleData.projects && roleData.projects.length ? roleData.projects.map((p) => `\`${p}\``).join(', ') : '`None`'
                    }\n`;
                    content += `**Contributions :** ${roleData.contributions || 0}\n`;
                    content += `**Notes :** ${roleData.notes || '_No notes_'}`;
                } else if (role === 'Staff') {
                    content += `**Position :** ${roleData.position || '`N/A`'}\n`;
                    content += `**Department :** ${roleData.department || '`N/A`'}\n`;
                    content += `**Status :** \`${roleData.status || 'Active'}\`\n`;
                    content += `**Notes :** ${roleData.notes || '_No notes_'}`;
                } else if (role === 'Partnership') {
                    content += `**Company :** ${roleData.companyName || '`N/A`'}\n`;
                    content += `**Partnership Type :** ${roleData.partnershipType || '`N/A`'}\n`;
                    content += `**Contact Person :** ${roleData.contactPerson || '`N/A`'}\n`;
                    content += `**Contact Email :** ${roleData.contactEmail || '`N/A`'}\n`;
                    content += `**Agreement :** ${roleData.agreement || '`N/A`'}\n`;
                    content += `**Notes :** ${roleData.notes || '_No notes_'}`;
                }

                return text.setContent(content);
            });
        }

        container.addSeparatorComponents((sep) => sep.setDivider(false));
        container.addTextDisplayComponents((text) =>
            text.setContent(`*${generalMessages.requestedBy.replace('%{username}', ctx.author.displayName)}*`)
        );

        return container;
    }

    async run(client, ctx, args, color, emoji, language) {
        try {
            const defaultMessages = {
                generalMessages: {
                    title: '%{mainLeft} %{title} %{mainRight}',
                    requestedBy: 'Requested by %{username}',
                },
            };

            const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages || defaultMessages.generalMessages;

            // Get role from args or slash command options
            let selectedRole = ctx.isInteraction ? ctx.interaction.options.getString('role') : args[0]?.toLowerCase();

            // Convert to proper case
            if (selectedRole) {
                selectedRole = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
            }

            // Step 1: Show role selector if no role provided
            if (!selectedRole) {
                const roleSelectMenu = this.buildRoleSelectMenu();
                const row = new ActionRowBuilder().addComponents(roleSelectMenu);

                const instructionContainer = new ContainerBuilder().setAccentColor(color.main);
                instructionContainer.addTextDisplayComponents((text) =>
                    text.setContent(
                        generalMessages.title
                            .replace('%{mainLeft}', emoji.mainLeft || '🧡')
                            .replace('%{title}', 'SELECT ROLE')
                            .replace('%{mainRight}', emoji.mainRight || '🧡')
                    )
                );
                instructionContainer.addSeparatorComponents((sep) => sep);
                instructionContainer.addTextDisplayComponents(
                    (text) => text.setContent('**Choose a role to view all members under that role.**'),
                    (text) => text.setContent(`*${generalMessages.requestedBy.replace('%{username}', ctx.author.displayName)}*`)
                );

                const selectionMessage = await ctx.sendMessage({
                    components: [instructionContainer, row],
                    flags: MessageFlags.IsComponentsV2,
                });

                // Collector for role select menu
                const roleCollector = selectionMessage.createMessageComponentCollector({
                    filter: (i) => {
                        if (!i.isStringSelectMenu()) return false;
                        if (i.user.id !== ctx.author.id) {
                            i.reply({
                                content: 'Only the command user can select a role.',
                                flags: 64,
                            });
                            return false;
                        }
                        return true;
                    },
                    time: 60_000,
                    max: 1,
                });

                roleCollector.on('collect', async (interaction) => {
                    try {
                        const role = interaction.values[0];
                        await this.displayRoleUsers(client, ctx, role, color, emoji, generalMessages, interaction, selectionMessage);
                    } catch (err) {
                        console.error('Error in role selection:', err);
                        interaction.reply({
                            content: '❌ An error occurred while processing your selection.',
                            flags: 64,
                        });
                    }
                });

                roleCollector.on('end', async (_, reason) => {
                    if (reason === 'time' && selectionMessage.editable) {
                        try {
                            const disabledMenu = StringSelectMenuBuilder.from(roleSelectMenu).setDisabled(true);
                            const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
                            await selectionMessage.edit({
                                components: [instructionContainer, disabledRow],
                                flags: MessageFlags.IsComponentsV2,
                            });
                        } catch (err) {
                            console.error('Error disabling role select menu:', err);
                        }
                    }
                });

                return;
            }

            // Step 2: Show users for selected role
            await this.displayRoleUsers(client, ctx, selectedRole, color, emoji, generalMessages);
        } catch (err) {
            console.error('Failed to execute checkroles:', err);
            await client.utils.sendErrorMessage(client, ctx, 'An error occurred while executing the command.', color);
        }
    }

    async displayRoleUsers(client, ctx, role, color, emoji, generalMessages, roleInteraction = null, previousMessage = null) {
        try {
            // Fetch all users with this role
            let users = await UserCommunity.find({ role }).lean().select('userId username');

            // Fetch Discord user data to get display names
            const enrichedUsers = await Promise.all(
                users.map(async (user) => {
                    try {
                        const discordUser = await client.users.fetch(user.userId).catch(() => null);
                        return {
                            ...user,
                            displayName: discordUser?.displayName || discordUser?.username || user.username || 'Unknown',
                            username: discordUser?.username || user.username || 'Unknown',
                        };
                    } catch (err) {
                        return {
                            ...user,
                            displayName: user.username || 'Unknown',
                            username: user.username || 'Unknown',
                        };
                    }
                })
            );

            users = enrichedUsers;

            const usersListContainer = this.buildUsersListContainer({
                color,
                emoji,
                generalMessages,
                role,
                users,
                ctx,
            });

            // Build role filter menu (always visible to switch roles)
            const roleFilterMenu = this.buildRoleSelectMenu(role);
            const roleFilterRow = new ActionRowBuilder().addComponents(roleFilterMenu);

            // If no users, just show the list with role filter
            if (users.length === 0) {
                if (roleInteraction) {
                    await roleInteraction.update({
                        components: [usersListContainer, roleFilterRow],
                        flags: MessageFlags.IsComponentsV2,
                    });
                    this.setupRoleCollector(client, ctx, roleInteraction.message, color, emoji, generalMessages);
                } else {
                    const message = await ctx.sendMessage({
                        components: [usersListContainer, roleFilterRow],
                        flags: MessageFlags.IsComponentsV2,
                    });
                    this.setupRoleCollector(client, ctx, message, color, emoji, generalMessages);
                }
                return;
            }

            // Build user select menu
            const userSelectMenu = this.buildUserSelectMenu(users, role);
            const userRow = new ActionRowBuilder().addComponents(userSelectMenu);

            // Send or update message with role filter + user select
            let message;
            if (roleInteraction) {
                await roleInteraction.update({
                    components: [usersListContainer, roleFilterRow, userRow],
                    flags: MessageFlags.IsComponentsV2,
                });
                message = roleInteraction.message;
            } else {
                message = await ctx.sendMessage({
                    components: [usersListContainer, roleFilterRow, userRow],
                    flags: MessageFlags.IsComponentsV2,
                });
            }

            // Collector for user select menu
            const userCollector = message.createMessageComponentCollector({
                filter: (i) => {
                    if (!i.isStringSelectMenu()) return false;
                    const customId = i.customId;
                    if (!customId.startsWith(`checkroles_userselect_${role}`)) return false;

                    if (i.user.id !== ctx.author.id) {
                        i.reply({
                            content: 'Only the command user can select a user.',
                            flags: 64,
                        });
                        return false;
                    }
                    return true;
                },
                time: 60_000,
            });

            userCollector.on('collect', async (userInteraction) => {
                try {
                    const userId = userInteraction.values[0];

                    // Fetch user from Discord
                    const discordUser = await client.users.fetch(userId).catch(() => null);

                    // Fetch user community data
                    const userDoc = await UserCommunity.findOne({ userId }).lean();

                    if (!discordUser || !userDoc) {
                        await userInteraction.reply({
                            content: '❌ User data not found.',
                            flags: 64,
                        });
                        return;
                    }

                    // Build profile container
                    const profileContainer = this.buildProfileContainer({
                        color,
                        emoji,
                        generalMessages,
                        user: discordUser,
                        doc: userDoc,
                        ctx,
                    });

                    await userInteraction.update({
                        components: [usersListContainer, profileContainer, roleFilterRow, userRow],
                        flags: MessageFlags.IsComponentsV2,
                    });
                } catch (err) {
                    console.error('Error in user selection:', err);
                    userInteraction.reply({
                        content: '❌ An error occurred while loading user profile.',
                        flags: 64,
                    });
                }
            });

            userCollector.on('end', async (_, reason) => {
                if (reason === 'time' && message.editable) {
                    try {
                        const disabledMenu = StringSelectMenuBuilder.from(userSelectMenu).setDisabled(true);
                        const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
                        await message.edit({
                            components: [usersListContainer, disabledRow],
                            flags: MessageFlags.IsComponentsV2,
                        });
                    } catch (err) {
                        console.error('Error disabling user select menu:', err);
                    }
                }
            });

            // Setup role collector for switching roles
            this.setupRoleCollector(client, ctx, message, color, emoji, generalMessages);
        } catch (err) {
            console.error('Error in displayRoleUsers:', err);
            throw err;
        }
    }

    setupRoleCollector(client, ctx, message, color, emoji, generalMessages) {
        try {
            const roleCollector = message.createMessageComponentCollector({
                filter: (i) => {
                    if (!i.isStringSelectMenu()) return false;
                    const customId = i.customId;
                    if (!customId.startsWith('checkroles_roleselect_')) return false;

                    if (i.user.id !== ctx.author.id) {
                        i.reply({
                            content: 'Only the command user can change roles.',
                            flags: 64,
                        });
                        return false;
                    }
                    return true;
                },
                time: 300_000, // 5 minutes for role switching
            });

            roleCollector.on('collect', async (roleInteraction) => {
                try {
                    const newRole = roleInteraction.values[0];
                    // Re-fetch and display the new role's users
                    await this.displayRoleUsers(client, ctx, newRole, color, emoji, generalMessages, roleInteraction);
                } catch (err) {
                    console.error('Error switching roles:', err);
                    roleInteraction.reply({
                        content: '❌ An error occurred while switching roles.',
                        flags: 64,
                    });
                }
            });

            roleCollector.on('end', async (_, reason) => {
                if (reason === 'time' && message.editable) {
                    try {
                        // Disable all components after timeout
                        const rows = message.components;
                        const disabledRows = rows.map((row) => {
                            const newRow = new ActionRowBuilder();
                            row.components.forEach((component) => {
                                if (component.type === 3) {
                                    // STRING_SELECT
                                    newRow.addComponents(StringSelectMenuBuilder.from(component).setDisabled(true));
                                }
                            });
                            return newRow;
                        });

                        await message.edit({
                            components: disabledRows,
                            flags: MessageFlags.IsComponentsV2,
                        });
                    } catch (err) {
                        console.error('Error disabling role select menu:', err);
                    }
                }
            });
        } catch (err) {
            console.error('Error setting up role collector:', err);
        }
    }
};

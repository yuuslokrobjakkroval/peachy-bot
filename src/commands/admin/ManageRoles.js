const { Command } = require('../../structures/index.js');
const UserCommunity = require('../../schemas/userCommunity');
const globalEmoji = require('../../utils/Emoji');

const VALID_ROLES = ['Owner', 'Developer', 'Staff', 'Partnership'];

module.exports = class ManageRoles extends Command {
    constructor(client) {
        super(client, {
            name: 'manageroles',
            description: {
                content: 'Add or remove community roles for users',
                examples: ['manageroles add @user Developer', 'manageroles remove @user Staff'],
                usage: 'manageroles <add|remove> <user> <role>',
            },
            category: 'admin',
            aliases: ['mr'],
            cooldown: 1,
            args: true,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: 'action',
                    description: 'Action to perform (add or remove)',
                    type: 3,
                    required: true,
                },
                {
                    name: 'user',
                    description: 'The Discord user ID of the user',
                    type: 3,
                    required: true,
                },
                {
                    name: 'role',
                    description: 'The role to add/remove (Owner, Developer, Staff, Partnership)',
                    type: 3,
                    required: true,
                },
            ],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const generalMessages = language.locales.get(language.defaultLocale)?.generalMessages;

        // Parse arguments
        const action = args[0]?.toLowerCase();
        const roleTarget = args[2]?.toLowerCase();

        // Validate action
        if (!['add', 'remove'].includes(action)) {
            return await client.utils.sendErrorMessage(client, ctx, `Invalid action. Use \`add\` or \`remove\`.`, color);
        }

        // Validate role
        const validRole = VALID_ROLES.find((r) => r.toLowerCase() === roleTarget);
        if (!validRole) {
            return await client.utils.sendErrorMessage(client, ctx, `Invalid role. Available roles: ${VALID_ROLES.join(', ')}`, color);
        }

        // Get user mention
        const mention = ctx.isInteraction
            ? ctx.interaction.options.getUser('user') || ctx.author
            : ctx.message.mentions.members.first() || ctx.guild.members.cache.get(args[1]) || args[1];

        const userId = typeof mention === 'string' ? mention : mention.id;

        try {
            const syncUser = await client.users.fetch(userId);

            if (syncUser && syncUser?.bot) {
                return await client.utils.sendErrorMessage(client, ctx, generalMessages.botTransfer, color);
            }

            let result;

            if (action === 'add') {
                result = await this.addRole(userId, validRole);
            } else {
                result = await this.removeRole(userId, validRole);
            }

            if (!result.success) {
                return await client.utils.sendErrorMessage(client, ctx, result.message, color);
            }

            const embed = client
                .embed()
                .setColor(color.main)
                .setDescription(`${globalEmoji.result.tick} Successfully ${action}ed role **${validRole}** for <@${userId}>.`)
                .addFields(
                    {
                        name: 'User ID',
                        value: userId,
                        inline: true,
                    },
                    {
                        name: 'Action',
                        value: action.charAt(0).toUpperCase() + action.slice(1),
                        inline: true,
                    },
                    {
                        name: 'Role',
                        value: validRole,
                        inline: true,
                    }
                );

            return ctx.sendMessage({ embeds: [embed] });
        } catch (error) {
            console.error('Error in ManageRoles command:', error);
            return await client.utils.sendErrorMessage(client, ctx, `An error occurred: ${error.message}`, color);
        }
    }

    async addRole(userId, role) {
        try {
            // Check if trying to add Owner role
            if (role === 'Owner') {
                // Check if another Owner already exists
                const existingOwner = await UserCommunity.findOne({ role: 'Owner' });
                if (existingOwner && existingOwner.userId !== userId) {
                    return {
                        success: false,
                        message: `There is already an Owner assigned: <@${existingOwner.userId}>. Remove their role first before assigning a new Owner.`,
                    };
                }
            }

            let communityData = await UserCommunity.findOne({ userId });

            if (!communityData) {
                // Create new document with the role
                communityData = new UserCommunity({
                    userId,
                    role,
                    [role.toLowerCase()]: {
                        joinedDate: new Date(),
                        permissions: [],
                        specialization: '',
                        projects: [],
                        contributions: 0,
                        position: '',
                        department: '',
                        status: 'Active',
                        companyName: '',
                        partnershipType: '',
                        contactPerson: '',
                        contactEmail: '',
                        agreement: '',
                        notes: '',
                    },
                });
            } else {
                // Update existing document
                communityData.role = role;
                communityData[role.toLowerCase()] = {
                    joinedDate: new Date(),
                    permissions: [],
                    specialization: '',
                    projects: [],
                    contributions: 0,
                    position: '',
                    department: '',
                    status: 'Active',
                    companyName: '',
                    partnershipType: '',
                    contactPerson: '',
                    contactEmail: '',
                    agreement: '',
                    notes: '',
                };
            }

            await communityData.save();
            return {
                success: true,
                message: `Role ${role} added successfully`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to add role: ${error.message}`,
            };
        }
    }

    async removeRole(userId, role) {
        try {
            const communityData = await UserCommunity.findOne({ userId });

            if (!communityData) {
                return {
                    success: false,
                    message: `User ${userId} has no community roles assigned`,
                };
            }

            if (communityData.role !== role) {
                return {
                    success: false,
                    message: `User ${userId} does not have the role ${role}`,
                };
            }

            // Remove the role data
            communityData[role.toLowerCase()] = undefined;
            communityData.role = null;

            await communityData.save();
            return {
                success: true,
                message: `Role ${role} removed successfully`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to remove role: ${error.message}`,
            };
        }
    }
};

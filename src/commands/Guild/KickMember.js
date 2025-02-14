const { Command } = require('../../structures/index.js');
const globalConfig = require('../../utils/Config');

module.exports = class KickMember extends Command {
    constructor(client) {
        super(client, {
            name: 'kickmember',
            description: {
                content: 'Kick a specific member by ID.',
                examples: ['kickmember <member_id>'],
                usage: 'kickmember <member_id>',
            },
            category: 'guild',
            aliases: ['km'],
            cooldown: 3,
            args: true,
            permissions: {
                dev: true,
                staff: true,
                client: ['KickMembers'],
                user: ['KickMembers'],
            },
            slashCommand: false,
            options: [{ name: 'member_id', type: 'STRING', required: true }],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Ensure the command is used in the configured guild
        const guild = client.guilds.cache.get(globalConfig.guildId);
        if (!guild) {
            return client.utils.sendErrorMessage(client, ctx, 'Bot is not in the configured guild.', color);
        }

        // Get the member ID from arguments
        const memberId = args[0];
        if (!memberId) {
            return client.utils.sendErrorMessage(client, ctx, 'Please provide a valid member ID.', color);
        }

        // Fetch the member
        let member;
        try {
            member = await guild.members.fetch(memberId);
        } catch (error) {
            return client.utils.sendErrorMessage(client, ctx, 'Member not found or invalid ID.', color);
        }

        // Ensure the bot can kick this member
        if (!member.kickable) {
            return client.utils.sendErrorMessage(client, ctx, 'I cannot kick this member due to role hierarchy or permissions.', color);
        }

        // Attempt to kick the member
        try {
            await member.kick('Kicked by command');
            return client.utils.sendSuccessMessage(client, ctx, `Successfully kicked ${member.user.tag} (${member.id}).`, color);
        } catch (error) {
            console.error(`Failed to kick member: ${member.user.tag} (${member.id})`, error);
            return client.utils.sendErrorMessage(client, ctx, 'Failed to kick the member.', color);
        }
    }
};
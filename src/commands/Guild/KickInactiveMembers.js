const { Command } = require('../../structures/index.js');
const globalConfig = require('../../utils/Config');

module.exports = class KickInactiveMembers extends Command {
    constructor(client) {
        super(client, {
            name: 'kickinactive',
            description: {
                content: 'Kick all members who have been offline for more than 30 days.',
                examples: ['kickinactive'],
                usage: 'kickinactive',
            },
            category: 'guild',
            aliases: ['kim'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['KickMembers'],
                user: ['KickMembers'],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        // Ensure the command is used in the configured guild
        const guild = client.guilds.cache.get(globalConfig.guildId);
        if (!guild) {
            return client.utils.sendErrorMessage(client, ctx, 'Bot is not in the configured guild.', color);
        }

        // Fetch all members
        await guild.members.fetch();
        const now = Date.now();
        const threshold = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

        // Filter members who are offline for more than 30 days and are not bots
        const membersToKick = guild.members.cache.filter(member =>
            !member.user.bot &&
            member.presence?.status !== 'online' &&
            member.joinedTimestamp < now - threshold
        );

        if (membersToKick.size === 0) {
            return client.utils.sendSuccessMessage(client, ctx, 'No inactive members to kick.', color);
        }

        // Send processing message
        await client.utils.sendSuccessMessage(client, ctx, `Kicking ${membersToKick.size} inactive member(s)...`, color);

        let kickedMembers = [];
        for (const member of membersToKick.values()) {
            try {
                await member.kick('Inactive for more than 30 days');
                kickedMembers.push(`- ${member.user.tag} (${member.id})`);
            } catch (error) {
                console.error(`Failed to kick: ${member.user.tag} (${member.id})`, error);
            }
        }

        // Final message listing kicked members
        const kickMessage = kickedMembers.length > 0
            ? `Kicked the following inactive members:
${kickedMembers.join('\n')}`
            : 'No members were kicked.';

        return client.utils.sendSuccessMessage(client, ctx, kickMessage, color);
    }
};

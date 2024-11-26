const { Command } = require('../../structures');
const Invite = require('../../schemas/inviteTracker');

module.exports = class SyncInvites extends Command {
    constructor(client) {
        super(client, {
            name: 'fetchinvites',
            description: {
                content: 'Sync all invite codes for the guild or all guilds.',
                examples: ['fetchinvites', 'fetchinvites all'],
                usage: 'fetchinvites [all]',
            },
            category: 'utility',
            aliases: ['si'],
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'ManageGuild'],
                user: ['ManageGuild'],
            },
            slashCommand: false,
            options: [{
                name: 'all',
                type: 5,
                description: 'Sync invites for all guilds the bot is in.',
                required: false,
            }],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const syncAll = args[0]?.toLowerCase() === 'all'; // Check if syncing all guilds
        const guilds = syncAll ? client.guilds.cache.values() : [ctx.guild];
        const resultMessages = [];

        for (const guild of guilds) {
            try {
                const invites = await guild.invites.fetch();
                const inviteCodes = invites.map(invite => invite.code);

                // Fetch and delete outdated invites from the database
                const dbInvites = await Invite.find({ guildId: guild.id });
                let removedCount = 0;
                for (const dbInvite of dbInvites) {
                    if (!inviteCodes.includes(dbInvite.inviteCode)) {
                        await dbInvite.deleteOne();
                        removedCount++;
                    }
                }

                const invitePromises = invites.map(async invite => {
                    try {
                        const existingInvite = await Invite.findOne({ inviteCode: invite.code });
                        if (!existingInvite) {
                            const newInvite = new Invite({
                                guildId: guild.id,
                                guildName: guild.name,
                                inviteCode: invite.code,
                                uses: invite.uses,
                                userId: [],
                                inviterId: invite.inviter.id,
                                inviterTag: invite.inviter.tag,
                            });
                            await newInvite.save();
                        } else {
                            existingInvite.uses = invite.uses;
                            await existingInvite.save();
                        }
                    } catch (error) {
                        console.error(`Error handling invite for guild ${guild.name}:`, error);
                    }
                });

                await Promise.all(invitePromises);

                // Prepare a result message for the current guild
                if (removedCount > 0) {
                    resultMessages.push(`Guild **${guild.name}** removed **${removedCount}** outdated invite code(s) and synchronized successfully.`);
                } else {
                    resultMessages.push(`Guild **${guild.name}** synchronized successfully with no outdated invite codes.`);
                }
            } catch (error) {
                console.error(`Error syncing invites for guild ${guild.name}:`, error);
                resultMessages.push(`Failed to sync invites for guild **${guild.name}**.`);
            }
        }

        const summary = resultMessages.join('\n');
        return client.utils.sendSuccessMessage(client, ctx, `${emoji.tick} **Invite Synchronization Summary:**\n${summary}`, color);
    }
};

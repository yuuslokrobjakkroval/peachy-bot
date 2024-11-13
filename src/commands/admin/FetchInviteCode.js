const { Command } = require('../../structures/index.js');
const Invite = require('../../schemas/inviteTracker');

module.exports = class FetchInvites extends Command {
    constructor(client) {
        super(client, {
            name: 'fetchinvites',
            description: {
                content: 'Fetch all invite codes for the guild',
                examples: ['fetchinvites'],
                usage: 'fetchinvites',
            },
            category: 'utility',
            aliases: ['fi'],
            args: false,
            permissions: {
                dev: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: ['ManageGuild'],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const guild = ctx.guild;
        try {
            const invites = await guild.invites.fetch();
            const invitePromises = invites.map(async invite => {
                try {
                    const existingInvite = await Invite.findOne({ inviteCode: invite.code });
                    if (!existingInvite) {
                        const newInvite = new Invite({
                            guildId: guild.id,
                            inviteCode: invite.code,
                            uses: invite.uses,
                            inviterId: invite.inviter.id,
                            inviterTag: invite.inviter.tag,
                        });
                        await newInvite.save();
                    } else {
                        existingInvite.uses = invite.uses;
                        await existingInvite.save();
                    }
                } catch (error) {
                    console.error('Error handling invite:', error);
                }
            });
            await Promise.all(invitePromises);
            return ctx.sendSuccessMessage(client, ctx, `${emoji.tick} Successfully fetched and saved all invites for the guild.`, color);
        } catch (error) {
            console.error('Error fetching invites:', error);
            return ctx.sendErrorMessage(client,ctx, `${emoji.deny} Failed to fetch invites for the guild.`, color);
        }
    }
};

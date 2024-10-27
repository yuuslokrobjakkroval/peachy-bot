const { Command } = require('../../structures/index.js');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = class ListGuildInvites extends Command {
    constructor(client) {
        super(client, {
            name: 'listguildinvites',
            description: {
                content: 'Lists all guilds with invite links where the bot can create invites.',
                examples: ['listguildinvites'],
                usage: 'listguildinvites',
            },
            category: 'developer',
            aliases: ['gli'],
            cooldown: 5,
            args: false,
            permissions: {
                dev: true,
                staff: true,
                client: ['SendMessages', 'ViewChannel', 'EmbedLinks'],
                user: [],
            },
            slashCommand: false,
            options: [],
        });
    }

    async run(client, ctx, args, color, emoji, language) {
        const guildInviteData = [];

        for (const guild of client.guilds.cache.values()) {
            let channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
            if (!channel) {
                channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildVoice);
            }

            if (channel && channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)) {
                try {
                    const invite = await channel.createInvite({ maxAge: 0, maxUses: 5, reason: 'Listing server invites' });
                    const inviteLink = invite.url;
                    guildInviteData.push({ name: guild.name, link: inviteLink });
                } catch (error) {
                    console.error(`Failed to create invite for guild ${guild.name}:`, error);
                }
            }
        }

        if (guildInviteData.length === 0) {
            return client.utils.sendErrorMessage(client, ctx, 'No guild invites available.', color);
        }

        const inviteList = guildInviteData.map(data => `**${data.name}**: ${data.link}`).join('\n');
        const embed = this.client
            .embed()
            .setColor(color || this.client.config.color.success)
            .setTitle('Guild Invite Links')
            .setDescription(inviteList)
            .setTimestamp();

        await ctx.sendMessage({ embeds: [embed] });
    }
};
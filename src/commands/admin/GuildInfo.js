const { Command } = require('../../structures/index.js');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = class GuildInfo extends Command {
    constructor(client) {
        super(client, {
            name: 'guildinfo',
            description: {
                content: 'Fetches information about a guild and creates an invite link for joining.',
                examples: ['guildinfo'],
                usage: 'guildinfo <guild_id>',
            },
            category: 'developer',
            aliases: ['ginfo'],
            cooldown: 3,
            args: true,
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

    async run(client, ctx, args) {
        // Fetch the guild from the cache based on the provided guild ID
        const guild = this.client.guilds.cache.get(args[0]);
        if (!guild) {
            return await ctx.sendMessage('Guild not found.');
        }

        // Fetch the guild owner
        let owner = await guild.members.fetch(guild.ownerId).catch(() => null);
        if (!owner) {
            owner = { user: { tag: 'Unknown#0000' } };
        }

        // Ensure guild member count exists and convert it to string
        const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

        // Find a suitable channel to create an invite link
        let channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
        if (!channel) {
            channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildVoice);
            if (!channel) {
                return await ctx.sendMessage('No suitable channels found to create an invite link.');
            }
        }

        // Check if the bot has permission to create an invite link in the channel
        if (!channel?.permissionsFor(channel.guild.members.me).has([PermissionFlagsBits.CreateInstantInvite])) {
            return await ctx.sendMessage("Sorry, I don't have permission to create an invite link in this channel.");
        }

        // Create an invite link with no expiration and a maximum of 5 uses
        let invite = await channel.createInvite({ maxAge: 0, maxUses: 5, reason: `Requested by Miku Dev` });
        let inviteLink = invite?.url || `https://discord.gg/${invite?.code}`;

        // Create and send an embed with guild information and invite link
        const embed = this.client
            .embed()
            .setColor(this.client.config.color.green)
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ format: 'jpeg' }) })
            .setDescription(`**${guild.name}** has been added to my guilds!`)
            .setThumbnail(guild.iconURL({ format: 'jpeg' }))
            .addFields([
                { name: 'Owner', value: owner.user.tag, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Members', value: memberCount, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Invite Link', value: inviteLink, inline: true },
            ])
            .setTimestamp();

        await ctx.sendMessage({ embeds: [embed] });
    }
};

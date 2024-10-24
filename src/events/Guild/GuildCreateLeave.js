const { Event } = require('../../structures/index.js');
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const config = require('../../config.js'); // Assuming you have a config file with the guild ID

module.exports = class GuildCreate extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'guildCreate',
        });
    }

    async run(guild) {
        const channelId = '1289803142606622771'; // Replace with your specific channel ID
        // if (guild.id !== config.guildId) {
        //     let owner;
        //     try {
        //         owner = await guild.fetchOwner();
        //     } catch (e) {
        //         owner = { user: { tag: 'Unknown#0000' } };
        //     }
        //     const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';
        //     const logChannel = this.client.channels.cache.get(channelId);
        //     if (logChannel) {
        //         const embed = this.client.embed()
        //             .setColor('Red')
        //             .setTitle('Unauthorized Guild Invite')
        //             .setDescription(`The bot was invited to an unauthorized guild and has now left.`)
        //             .addFields([
        //                 { name: 'Guild Name', value: guild.name, inline: true },
        //                 { name: 'Guild ID', value: guild.id, inline: true },
        //                 { name: 'Owner', value: owner.user.tag, inline: true },
        //                 { name: 'Owner ID', value: guild.ownerId, inline: true },
        //                 { name: 'Member Count', value: memberCount, inline: true },
        //             ])
        //             .setTimestamp();
        //
        //         await logChannel.send({ embeds: [embed] });
        //     } else {
        //         console.log('Log channel not found!');
        //     }
        //     return await guild.leave().catch((err) => console.error(`Failed to leave the guild: ${err}`));
        // }
        let owner;
        try {
            owner = guild.members.cache.get(guild?.ownerId);
        } catch (e) {
            owner = await guild.fetchOwner();
        }
        if (!owner) owner = { user: { tag: 'Unknown#0000' } };
        const channel = this.client.channels.cache.get(channelId);

        if (channel) {
            let owner = await guild.members.fetch(guild.ownerId).catch(() => null);
            if (!owner) {
                owner = { user: { tag: 'Unknown#0000' } };
            }

            const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

            let inviteChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
            if (!inviteChannel) {
                inviteChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildVoice);
                if (!inviteChannel) {
                    return await channel.sendMessage('No suitable channels found to create an invite link.');
                }
            }

            // Check if the bot has permission to create an invite link in the channel
            if (!inviteChannel?.permissionsFor(inviteChannel.guild.members.me).has([PermissionFlagsBits.CreateInstantInvite])) {
                return await channel.sendMessage("Sorry, I don't have permission to create an invite link in this channel.");
            }

            // Create an invite link with no expiration and a maximum of 5 uses
            let invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 5, reason: `Requested by Peachy Dev` });
            let inviteLink = invite?.url || `https://discord.gg/${invite?.code}`;

            const embed = this.client.embed()
                .setColor('Green')
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ format: 'jpeg' }) })
                .setDescription(`**${guild.name}** has been invited to the bot!`)
                .setThumbnail(guild.iconURL({ format: 'jpeg' }))
                .addFields([
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Members', value: memberCount, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Invite Link', value: inviteLink, inline: true },
                ])
                .setTimestamp()
                .setFooter({ text: 'Thank you for inviting me!', iconURL: this.client.user.displayAvatarURL() });

            // Send the embed to the channel
            await channel.send({ embeds: [embed] });
        } else {
            console.log('Channel not found!');
        }
    }
};

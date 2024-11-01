const { Event } = require('../../structures/index.js');
const { ChannelType, PermissionFlagsBits } = require("discord.js");

module.exports = class GuildCreate extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'guildCreate',
        });
    }

    run(guild) {
        const channelId = '1289803142606622771';
        let owner;

        owner = guild.members.cache.get(guild?.ownerId);
        if (!owner) {
            guild.fetchOwner().then(fetchedOwner => {
                owner = fetchedOwner;
                sendGuildInfo(guild, owner);
            }).catch(() => {
                owner = { user: { tag: 'Unknown#0000' } };
                sendGuildInfo(guild, owner);
            });
        } else {
            sendGuildInfo(guild, owner);
        }

        function sendGuildInfo(guild, owner) {
            const channel = this.client.channels.cache.get(channelId);
            if (!channel) {
                console.log('Channel not found!');
                return;
            }

            const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

            let inviteChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
            if (!inviteChannel) {
                inviteChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildVoice);
                if (!inviteChannel) {
                    return channel.sendMessage('No suitable channels found to create an invite link.').catch(console.error);
                }
            }

            if (!inviteChannel.permissionsFor(inviteChannel.guild.members.me).has([PermissionFlagsBits.CreateInstantInvite])) {
                return channel.sendMessage("Sorry, I don't have permission to create an invite link in this channel.").catch(console.error);
            }

            inviteChannel.createInvite({ maxAge: 0, maxUses: 5, reason: `Requested by Peachy Dev` })
                .then(invite => {
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
                    channel.send({ embeds: [embed] }).catch(console.error);
                })
                .catch(err => {
                    console.error("Failed to create an invite:", err);
                    channel.sendMessage("Failed to create an invite link.").catch(console.error);
                });
        }
    }
};

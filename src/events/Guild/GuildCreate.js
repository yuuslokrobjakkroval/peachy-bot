const { Event } = require('../../structures/index.js');

module.exports = class GuildCreate extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'guildCreate',
        });
        this.inviteTrack = new Map(); // Store inviter references here
    }

    run(guild) {
        const inviter = this.inviteTrack.get(guild.id) || 'Unknown'; // Try to find inviter

        let owner;
        owner = guild.members.cache.get(guild?.ownerId);
        if (!owner) {
            guild.fetchOwner().then(fetchedOwner => {
                owner = fetchedOwner;
                sendGuildInfo(this.client, guild, owner, inviter);
            }).catch(() => {
                owner = { user: { tag: 'Unknown#0000' } };
                sendGuildInfo(this.client, guild, owner, inviter);
            });
        } else {
            sendGuildInfo(this.client, guild, owner, inviter);
        }

        function sendGuildInfo(client, guild, owner, inviter) {
            const channel = client.channels.cache.get(client.config.channel.log);
            if (!channel) {
                console.log('Channel not found!');
                return;
            }

            const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

            const embed = client.embed()
                .setColor(client.color.success)
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ format: 'jpeg' }) })
                .setDescription(`**${guild.name}** has been invited to the bot!`)
                .setThumbnail(guild.iconURL({ format: 'jpeg' }))
                .addFields([
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Members', value: memberCount, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Inviter', value: inviter ? inviter : 'Unknown', inline: true }, // Add inviter here
                ])
                .setTimestamp()
                .setFooter({ text: 'Thank you for inviting me!', iconURL: client.user.displayAvatarURL() });

            channel.send({ embeds: [embed] }).catch(console.error);
        }
    }
};

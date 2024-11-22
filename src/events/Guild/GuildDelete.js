const { Event } = require('../../structures/index.js');

module.exports = class GuildDelete extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'guildDelete',
        });
    }

    run(guild) {
        let owner;
        owner = guild.members.cache.get(guild?.ownerId);
        if (!owner) {
            guild.fetchOwner().then(fetchedOwner => {
                owner = fetchedOwner;
                sendGuildInfo(this.client, guild, owner);
            }).catch(() => {
                owner = { user: { tag: 'Unknown#0000' } };
                sendGuildInfo(this.client, guild, owner);
            });
        } else {
            sendGuildInfo(this.client, guild, owner);
        }

        function sendGuildInfo(client, guild, owner) {
            const channel = this.client.channels.cache.get(this.client.config.channel.log);
            if (!channel) {
                console.log('Log channel not found!');
                return;
            }
            const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

            // Build the embed message
            const embed = client.embed()
                .setColor(client.color.danger)
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ format: 'jpeg' }) })
                .setDescription(`**${guild.name}** has removed the bot.`)
                .setThumbnail(guild.iconURL({ format: 'jpeg' }))
                .addFields([
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Members', value: memberCount, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                ])
                .setTimestamp()
                .setFooter({ text: 'Sorry to see you go!', iconURL: client.user.displayAvatarURL() });

            // Send the embed to the logging channel
            channel.send({ embeds: [embed] }).catch(console.error);
        }
    }
};

const { Event } = require('../../structures/index.js');

class GuildDelete extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'guildDelete',
        });
    }

    async run(guild) {
        const channelId = '1289803142606622771';
        const channel = this.client.channels.cache.get(channelId);

        if (channel) {
            let owner = await guild.members.fetch(guild.ownerId).catch(() => null);
            if (!owner) {
                owner = { user: { tag: 'Unknown#0000' } };
            }

            const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

            const embed = this.client.embed()
                .setColor('Red') // Set a different color for deletion
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ format: 'jpeg' }) })
                .setDescription(`**${guild.name}** has removed the bot from their server.`)
                .setThumbnail(guild.iconURL({ format: 'jpeg' }))
                .addFields([
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Members', value: memberCount, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                ])
                .setTimestamp()
                .setFooter({ text: 'Sorry to leave!', iconURL: this.client.user.displayAvatarURL() });

            channel.send({ embeds: [embed] });
        } else {
            console.log('Channel not found!');
        }
    }
}

module.exports = GuildDelete;

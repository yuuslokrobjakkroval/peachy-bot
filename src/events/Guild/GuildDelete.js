const { Event } = require('../../structures/index.js');

module.exports = class GuildDelete extends Event {
    constructor(client, file) {
        super(client, file, {
            name: 'guildDelete',
        });
    }

    async run(guild) {
        let owner;
        owner = guild.members.cache.get(guild?.ownerId);

        if (!owner) {
            try {
                owner = await guild.fetchOwner();
            } catch {
                owner = { user: { tag: 'Unknown#0000' } };
            }
        }

        // Attempt to fetch the user who removed the bot
        let remover = { tag: 'Unknown', id: 'Unknown' };
        try {
            const auditLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: 'BOT_REMOVE',
            });
            const logEntry = auditLogs.entries.first();

            if (logEntry && logEntry.target.id === this.client.user.id) {
                remover = {
                    tag: logEntry.executor.tag,
                    id: logEntry.executor.id,
                };
            }
        } catch (err) {
            console.error("Could not fetch audit logs:", err);
        }

        sendGuildInfo(this.client, guild, owner, remover);

        // Helper function to send guild leave information
        function sendGuildInfo(client, guild, owner, remover) {
            const channel = client.channels.cache.get(client.config.channel.log);
            if (!channel) {
                console.log('Log channel not found!');
                return;
            }

            const memberCount = guild.memberCount ? guild.memberCount.toString() : 'Unknown';

            // Build the embed message
            const embed = client.embed()
                .setColor('Red')
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ format: 'jpeg' }) })
                .setDescription(`**${guild.name}** has removed the bot.`)
                .setThumbnail(guild.iconURL({ format: 'jpeg' }))
                .addFields([
                    { name: 'Owner', value: owner.user.tag, inline: true },
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Members', value: memberCount, inline: true },
                    { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Removed By', value: `${remover.tag} (${remover.id})`, inline: true },
                ])
                .setTimestamp()
                .setFooter({ text: 'Sorry to see you go!', iconURL: client.user.displayAvatarURL() });

            // Send the embed to the logging channel
            channel.send({ embeds: [embed] }).catch(console.error);
        }
    }
};

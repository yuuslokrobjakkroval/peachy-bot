const { Event } = require('../../structures/index.js');
const {
    PermissionFlagsBits, ButtonBuilder,
} = require('discord.js');
const JoinToCreateSchema = require('../../schemas/joinToCreate');
const {channel} = require("../../utils/Emoji");

module.exports = class VoiceStateUpdate extends Event {
    constructor(client, file) {
        super(client, file, { name: 'voiceStateUpdate' });
    }

    async run(oldState, newState) {
        const config = await JoinToCreateSchema.findOne({ guildId: newState.guild.id })
        if (!config?.enabled) return;

        if (newState.channelId === config.channelId) {
            const channel = await newState.guild.channels.create({
                name: `${newState.member.displayName}'s Channel`,
                type: 2,
                parent: config.categoryId,
                userLimit: config.defaultUserLimit || 0,
                PermissionOverwrites: [
                    {
                        id: newState.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: newState.member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.MoveMembers,
                        ]
                    }
                ]
            });

            await newState.setChannel(channel)

            const updateConfig = await JoinToCreateSchema.findOneAndUpdate(
                { guildId: newState.guild.id },
                { $push: {
                        tempChannels: {
                            channelId: channel.id,
                            ownerId: newState.member.id,
                            locked: false,
                            hidden: true,
                            blockedUsers: []
                        }
                    }
                },
                { new: true }
            );

            const embed = this.client.embed()
                .setTitle('Voice Channel Controls')
                .setDescription('Use the button below to manage your voice channel')
                .addFields([
                    { name: 'Owner', value: `${newState.member}`, inline: true },
                    { name: 'Status', value: `Unlocked`, inline: true },
                    { name: 'Visibility', value: `Visible`, inline: true },
                    { name: 'User Limit', value: config.defaultUserLimit ? `${config.defaultUserLimit} Users` : 'No Limit', inline: true },
                ])
                .setTimestamp();

            const lockButton = this.client.utils.labelButton('vc-lock', 'Lock/Unlock', 1)
            const hideButton = this.client.utils.labelButton('vc-hide', 'Hide/Show', 1)
            const limitButton = this.client.utils.labelButton('vc-limit', 'User Limit', 1)
            const kickButton = this.client.utils.labelButton('vc-kick', 'Kick user', 4)
            const firstRow = this.client.utils.createButtonRow(lockButton, hideButton)
            const secondRow = this.client.utils.createButtonRow(limitButton, kickButton)

            await channel.send({
                content: `Channel created for ${newState.member}`,
                embeds: [embed],
                components: [firstRow, secondRow]
            });
        }

        if (oldState.channel) {
            const tempChannel = config.tempChannels.find(tc => tc.channelId === oldState.channelId);
            if (tempChannel && oldState.channel.members.size === 0) {
                await oldState.channel.delete().catch(() => {});
                await JoinToCreateSchema.findOneAndUpdate(
                    { guildId: oldState.guild.id },
                    { $pull: { tempChannels: { channelId: oldState.channelId } } },
                    { new: true }
                );
            }
        }

        if (newState.channel) {
            const tempChannel = config.tempChannels.find(tc => tc.channelId === newState.channelId);
            if (tempChannel && tempChannel.blockedUsers.includes(newState.member.id)) {
                await newState.disconnect();
            }
        }

    }
}

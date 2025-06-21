const { Event } = require("../../structures/index.js");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const JoinToCreateModel = require("../../schemas/joinToCreate");

module.exports = class JoinToCreate extends Event {
  constructor(client, file) {
    super(client, file, {
      name: "voiceStateUpdate",
    });
  }

  async run(oldState, newState) {
    const voiceState = newState;
    const { guild, channel, member } = voiceState;

    if (!guild || !member || !channel || !member.user) {
      return;
    }

    const setup = await JoinToCreateModel.findOne({ guildId: guild.id });
    if (!setup) {
      return;
    }

    const { channelId, categoryId, voiceLimit } = setup;

    if (voiceState.channelId !== channelId || channel.members.size !== 1)
      return;

    const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      console.warn(`Invalid or missing category channel: ${categoryId}`);
      return;
    }

    const newVoiceChannel = await guild.channels
      .create({
        name: `${member.user.username}'s Channel`,
        type: ChannelType.GuildVoice,
        parent: categoryId,
        userLimit: voiceLimit || undefined,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.Connect, // Allow connecting to the voice channel
              PermissionFlagsBits.ManageChannels, // Allow managing permissions (ManagePermissions)
            ],
          },
          {
            id: guild.roles.everyone.id,
            deny: [
              PermissionFlagsBits.UseSoundboard, // Deny using soundboard
              PermissionFlagsBits.UseSoundboard, // Deny using soundboard
              PermissionFlagsBits.UseExternalSounds, // Deny using external soundboard
              PermissionFlagsBits.UseExternalEmojis, // Deny using external emojis
              PermissionFlagsBits.UseExternalStickers, // Deny using external stickers
            ],
          },
        ],
      })
      .catch((error) => {
        console.error("Failed to create voice channel:", error);
        return null;
      });

    if (!newVoiceChannel) {
      console.warn("Failed to create new voice channel");
      return;
    }

    try {
      await member.voice.setChannel(newVoiceChannel);
    } catch (error) {
      console.error("Failed to move user to new voice channel:", error);
      // Clean up the channel if the user cannot be moved
      await newVoiceChannel
        .delete()
        .catch((error) => console.error("Failed to delete channel:", error));
      return;
    }

    const checkIfChannelEmpty = async (oldState, newState) => {
      if (
        oldState.channelId === newVoiceChannel.id &&
        newVoiceChannel.members.size === 0
      ) {
        await newVoiceChannel
          .delete()
          .catch((error) =>
            console.error("Failed to delete empty channel:", error),
          );
        guild.client.off("voiceStateUpdate", checkIfChannelEmpty); // Remove listener
      }
    };

    guild.client.on("voiceStateUpdate", checkIfChannelEmpty);
  }
};

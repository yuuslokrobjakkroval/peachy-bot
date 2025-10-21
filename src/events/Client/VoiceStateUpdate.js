const { Event } = require("../../structures/index.js");
const Users = require("../../schemas/user");

module.exports = class VoiceStateUpdate extends Event {
  constructor(client, file) {
    super(client, file, {
      name: "voiceStateUpdate",
    });

    this.activeVoiceUsers = new Map();
    this._startVoiceXpInterval();
  }

  async run(oldState, newState) {
    // Ignore bot voice changes
    if (newState.member.user.bot) return;

    const userId = newState.id;
    const member = newState.member;

    // Join
    if (!oldState.channelId && newState.channelId) {
      this.activeVoiceUsers.set(userId, {
        guildId: newState.guild.id,
        joinedAt: Date.now(),
      });
      this.client.serverStatsManager?.scheduleUpdate(newState.guild.id, 2000);
    }

    // Leave
    if (oldState.channelId && !newState.channelId) {
      this.activeVoiceUsers.delete(userId);
      this.client.serverStatsManager?.scheduleUpdate(newState.guild.id, 2000);
    }

    // Switch channel
    if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      this.activeVoiceUsers.set(userId, {
        guildId: newState.guild.id,
        joinedAt: Date.now(),
      });
      this.client.serverStatsManager?.scheduleUpdate(newState.guild.id, 2000);
    }
  }

  _startVoiceXpInterval() {
    setInterval(async () => {
      for (const [userId, data] of this.activeVoiceUsers.entries()) {
        try {
          const guild = this.client.guilds.cache.get(data.guildId);
          if (!guild) {
            console.log(`[Voice XP] Guild not found: ${data.guildId}`);
            continue;
          }

          const member = guild.members.cache.get(userId);
          if (!member || member.user.bot) {
            if (!member) console.log(`[Voice XP] Member not found: ${userId}`);
            continue;
          }

          if (member.voice.selfMute || member.voice.selfDeaf) {
            continue;
          }

          if (member.voice.channelId === guild.afkChannelId) {
            console.log(`[Voice XP] Ignored AFK user: ${member.user.tag}`);
            continue;
          }

          let user = await Users.findOne({ userId });
          if (!user) {
            console.log(
              `[Voice XP] No DB record for user: ${member.user.tag}, creating a new one with 500,000 coins.`,
            );

            user = new Users({
              username: member.user.tag,
              userId: userId,
              balance: {
                coin: 500000,
                bank: 0,
              },
            });

            try {
              await user.save();
              console.log(
                `[Voice XP] Created new user document for ${member.user.tag} with 500,000 coins.`,
              );
            } catch (error) {
              console.error(
                `[Voice XP] Error creating user for ${member.user.tag}:`,
                error,
              );
              continue; // Skip processing for this user if creation fails
            }
          }

          // Get color and emoji per user (async)
          const { color, emoji } =
            await this.client.setColorBasedOnTheme(userId);

          await this.client.utils.getVoiceCheckingUser(
            this.client,
            member,
            user,
            color,
            emoji,
          );
        } catch (error) {
          console.error(`[Voice XP] Error processing user ${userId}:`, error);
        }
      }
    }, 30000); // every 30 seconds
  }
};

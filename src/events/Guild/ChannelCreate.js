const { Event } = require("../../structures/index.js");

module.exports = class ChannelCreate extends Event {
  constructor(client, file) {
    super(client, file, { name: "channelCreate" });
  }

  async run(channel) {
    try {
      if (!channel.guild) return;
      this.client.serverStatsManager?.scheduleUpdate(channel.guild.id, 2000);
    } catch (_) {}
  }
};

